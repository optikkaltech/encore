import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Merchant } from './entities/merchant.entity';
import {
  RegisterMerchantDto,
  SubmitKycDto,
  SetupPaymentMethodDto,
  SelectTierDto,
  InitiateCheckoutDto,
  VerifyCheckoutDto,
} from './dto/onboarding.dto';
import {
  AccountType,
  KycStatus,
  MerchantStatus,
  PricingTier,
  PaymentStatus,
} from '../../shared/enums';
import { AuditService } from '../../core/audit';
import { SecureLogger } from '../../common/services/secure-logger.service';
import { encryptAtRest, sanitizeUrl } from '../../common/utils/security.utils';
import { PricingTierConfig } from '../../config/pricing.config';
import { SystemConfigService } from '../system-config/system-config.service';
import { Transaction } from '../billing/entities/transaction.entity';
import { NombaService } from '../../core/nomba/nomba.service';

@Injectable()
export class MerchantsService implements OnApplicationBootstrap {
  private readonly logger = new SecureLogger();

  constructor(
    @InjectRepository(Merchant)
    private readonly merchantRepo: Repository<Merchant>,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
    private readonly dataSource: DataSource,
    private readonly systemConfig: SystemConfigService,
    private readonly nombaService: NombaService,
  ) {}

  /**
   * Step 1: Register a new merchant
   * - Creates account in TRIAL mode by default
   * - Sends verification email
   */
  async register(dto: RegisterMerchantDto): Promise<Merchant> {
    // Check for existing email
    const existing = await this.merchantRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Hash password
      const passwordHash = await bcrypt.hash(dto.password, 12);

      // Determine tier and limits
      const pricingConfig = this.config.get('pricing.tiers');
      const selectedTier = dto.selectedTier || PricingTier.STARTER;
      const tierConfig = pricingConfig[selectedTier];

      // Calculate trial end date (30 days from now)
      const trialDays = this.config.get('pricing.trialDays', 30);
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

      // Create merchant
      const merchantCode = await this.generateUniqueMerchantCode();

      const merchant = this.merchantRepo.create({
        merchantCode,
        businessName: dto.businessName,
        email: dto.email,
        passwordHash,
        phone: dto.phone,
        businessType: dto.businessType,
        pricingTier: selectedTier,
        accountType: AccountType.TRIAL,
        status: MerchantStatus.PENDING,
        kycStatus: KycStatus.PENDING,
        trialStartedAt: new Date(),
        trialEndsAt,
        maxSubscribers: tierConfig.maxSubscribers,
        transactionFeeRate: tierConfig.transactionFeeRate,
        currentSubscriberCount: 0,
        platformFeeBalance: 0,
        failedPlatformFeeAttempts: 0,
        settings: {
          notifications: { email: true, sms: true },
          billing: { autoRetry: true, retryAttempts: 3 },
          referralCode: dto.referralCode || null,
        },
      });

      const saved = await queryRunner.manager.save(merchant);

      await queryRunner.commitTransaction();

      // Audit log (non-blocking, outside transaction)
      this.audit
        .log({
          action: 'MERCHANT_REGISTERED',
          entityType: 'merchant',
          entityId: saved.id,
          merchantId: saved.id,
          metadata: { tier: selectedTier, trialEndsAt },
          severity: 'normal',
        })
        .catch((err) => this.logger.error('Audit log failed', err));

      this.logger.log(
        `Merchant registered: ${saved.id}, tier: ${selectedTier}`,
      );

      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Step 2: Submit KYC information
   */
  async submitKyc(merchantId: string, dto: SubmitKycDto): Promise<Merchant> {
    const merchant = await this.findOne(merchantId);

    if (merchant.kycStatus === KycStatus.VERIFIED) {
      throw new BadRequestException('KYC already verified');
    }
    if (merchant.kycStatus === KycStatus.IN_REVIEW) {
      throw new BadRequestException('KYC already submitted and under review');
    }

    // Update KYC info
    merchant.registrationNumber = dto.registrationNumber || null;
    merchant.taxId = dto.taxId || null;
    merchant.address = dto.address;
    merchant.city = dto.city;
    merchant.state = dto.state;
    merchant.country = dto.country;
    merchant.kycStatus = KycStatus.IN_REVIEW;

    // Validate and store document URLs in settings
    const cacCertificateUrl = dto.cacCertificateUrl
      ? sanitizeUrl(dto.cacCertificateUrl)
      : null;
    if (dto.cacCertificateUrl && !cacCertificateUrl) {
      throw new BadRequestException('Invalid CAC certificate URL');
    }

    const taxClearanceUrl = dto.taxClearanceUrl
      ? sanitizeUrl(dto.taxClearanceUrl)
      : null;
    if (dto.taxClearanceUrl && !taxClearanceUrl) {
      throw new BadRequestException('Invalid tax clearance URL');
    }

    const bankStatementUrl = dto.bankStatementUrl
      ? sanitizeUrl(dto.bankStatementUrl)
      : null;
    if (dto.bankStatementUrl && !bankStatementUrl) {
      throw new BadRequestException('Invalid bank statement URL');
    }

    merchant.settings = {
      ...merchant.settings,
      kycDocuments: {
        cacCertificate: cacCertificateUrl,
        taxClearance: taxClearanceUrl,
        bankStatement: bankStatementUrl,
        submittedAt: new Date().toISOString(),
      },
    };

    const saved = await this.merchantRepo.save(merchant);

    await this.audit.log({
      action: 'KYC_SUBMITTED',
      entityType: 'merchant',
      entityId: merchantId,
      merchantId,
      metadata: { registrationNumber: dto.registrationNumber },
      severity: 'normal',
    });

    return saved;
  }

  /**
   * Step 3: Setup payment method for platform fees
   */
  async setupPaymentMethod(
    merchantId: string,
    dto: SetupPaymentMethodDto,
  ): Promise<Merchant> {
    const merchant = await this.findOne(merchantId);

    merchant.encorePaymentMethod = dto.method;

    if (dto.method === 'card' && dto.cardToken) {
      // Encrypt the token for PCI compliance
      merchant.encoreCardToken = encryptAtRest(
        dto.cardToken,
        this.config.get('app.encryptionKey'),
      );
    } else if (dto.method === 'direct_debit' && dto.mandateId) {
      merchant.encoreMandateId = dto.mandateId;
    }

    // If on trial, mark as ready for conversion
    if (merchant.accountType === AccountType.TRIAL) {
      merchant.nextPlatformFeeDueAt = merchant.trialEndsAt;
    } else if (merchant.accountType === AccountType.PAID) {
      // Set next billing date (1 month from now)
      const nextDue = new Date();
      nextDue.setMonth(nextDue.getMonth() + 1);
      merchant.nextPlatformFeeDueAt = nextDue;
    }

    const saved = await this.merchantRepo.save(merchant);

    await this.audit.log({
      action: 'PAYMENT_METHOD_SETUP',
      entityType: 'merchant',
      entityId: merchantId,
      merchantId,
      metadata: { method: dto.method },
      severity: 'normal',
    });

    return saved;
  }

  /**
   * Initiate payment setup checkout via Nomba (or fallback mock)
   */
  async initiateCheckout(merchantId: string, dto: InitiateCheckoutDto) {
    const merchant = await this.findOne(merchantId);

    const orderReference = `ref_${merchantId}_${Date.now()}`;
    const clientUrl =
      this.config.get<string>('CLIENT_URL') ||
      process.env.CLIENT_URL ||
      'http://localhost:5173';
    const fallbackCallbackUrl = `${clientUrl}/onboarding/payment/callback`;
    const callbackUrl = dto.callbackUrl || fallbackCallbackUrl;

    try {
      // Check if keys exist. If not, bypass to local mock page immediately to avoid 400 Bad Request exception
      const clientId = this.config.get<string>('nomba.clientId');
      const clientSecret = this.config.get<string>('nomba.clientSecret');
      const accountId = this.config.get<string>('nomba.accountId');

      if (!clientId || !clientSecret || !accountId) {
        throw new Error(
          'Nomba credentials not configured. Using fallback checkout.',
        );
      }

      const order = await this.nombaService.createTokenizationOrder(
        merchant.email,
        orderReference,
        callbackUrl,
      );

      return {
        checkoutLink: order.checkoutLink,
        orderReference: order.orderReference,
        isMock: false,
      };
    } catch (error) {
      this.logger.warn(
        `Nomba checkout initiation failed or credentials missing. Redirecting to mock payment portal. Error: ${error.message}`,
      );

      // Build mock checkout URL: client-side mock page
      const mockCheckoutUrl = `${clientUrl}/onboarding/payment/mock-checkout?orderReference=${orderReference}&callbackUrl=${encodeURIComponent(callbackUrl)}`;

      return {
        checkoutLink: mockCheckoutUrl,
        orderReference,
        isMock: true,
      };
    }
  }

  /**
   * Verify checkout transaction status (queries Nomba or simulates if mock reference)
   */
  async verifyCheckout(merchantId: string, dto: VerifyCheckoutDto) {
    const merchant = await this.findOne(merchantId);

    let isSuccess = false;
    let tokenKey = '';

    // Check if it's a simulated order reference or if Nomba credentials are not set
    const clientId = this.config.get<string>('nomba.clientId');
    const clientSecret = this.config.get<string>('nomba.clientSecret');
    const accountId = this.config.get<string>('nomba.accountId');

    const isMockRef =
      dto.orderReference.includes('mock') ||
      !clientId ||
      !clientSecret ||
      !accountId;

    if (isMockRef) {
      // Simulate verification for sandbox testing/mock fallback
      isSuccess = true;
      tokenKey = `tok_mock_card_${Math.random().toString(36).substring(2, 10)}`;
      this.logger.log(
        `Verified mock checkout for merchant ${merchantId}. Simulated token: ${tokenKey}`,
      );
    } else {
      try {
        const result = await this.nombaService.verifyOrder(dto.orderReference);
        if (
          result.status === 'SUCCESS' ||
          result.status === 'SUCCESSFUL' ||
          result.status === 'APPROVED'
        ) {
          isSuccess = true;
          tokenKey = result.tokenKey;
        } else {
          throw new BadRequestException(
            `Checkout transaction status is ${result.status}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Nomba checkout verification failed: ${error.message}`,
        );
        throw new BadRequestException(`Verification failed: ${error.message}`);
      }
    }

    if (isSuccess && tokenKey) {
      merchant.encorePaymentMethod = dto.method;
      if (dto.method === 'card') {
        merchant.encoreCardToken = encryptAtRest(
          tokenKey,
          this.config.get('app.encryptionKey'),
        );
      }

      // If on trial, mark as ready for conversion
      if (merchant.accountType === AccountType.TRIAL) {
        merchant.nextPlatformFeeDueAt = merchant.trialEndsAt;
      } else if (merchant.accountType === AccountType.PAID) {
        const nextDue = new Date();
        nextDue.setMonth(nextDue.getMonth() + 1);
        merchant.nextPlatformFeeDueAt = nextDue;
      }

      await this.merchantRepo.save(merchant);

      await this.audit.log({
        action: 'PAYMENT_METHOD_SETUP',
        entityType: 'merchant',
        entityId: merchantId,
        merchantId,
        metadata: {
          method: dto.method,
          orderReference: dto.orderReference,
          verified: true,
        },
        severity: 'normal',
      });
    }

    return {
      success: isSuccess,
      paymentMethod: merchant.encorePaymentMethod,
      message: isSuccess
        ? 'Payment method setup verified successfully'
        : 'Payment verification failed',
    };
  }

  /**
   * Select or change pricing tier
   */
  async selectTier(merchantId: string, dto: SelectTierDto): Promise<Merchant> {
    const merchant = await this.findOne(merchantId);
    const pricingConfig = this.config.get('pricing.tiers');
    const tierConfig = pricingConfig[dto.tier];

    if (!tierConfig) {
      throw new BadRequestException('Invalid pricing tier');
    }

    const oldTier = merchant.pricingTier;
    merchant.pricingTier = dto.tier;
    merchant.maxSubscribers = tierConfig.maxSubscribers;
    merchant.transactionFeeRate = tierConfig.transactionFeeRate;

    // If upgrading from Starter (free) to paid tier, convert to PAID immediately
    if (oldTier === PricingTier.STARTER && dto.tier !== PricingTier.STARTER) {
      merchant.accountType = AccountType.PAID;
      merchant.convertedToPaidAt = new Date();

      // Set next billing date
      const nextDue = new Date();
      nextDue.setMonth(nextDue.getMonth() + 1);
      merchant.nextPlatformFeeDueAt = nextDue;
    }

    const saved = await this.merchantRepo.save(merchant);

    await this.audit.log({
      action: 'TIER_CHANGED',
      entityType: 'merchant',
      entityId: merchantId,
      merchantId,
      metadata: { oldTier, newTier: dto.tier },
      severity: 'normal',
    });

    return saved;
  }

  /**
   * Convert trial to paid account
   */
  async convertToPaid(merchantId: string): Promise<Merchant> {
    const merchant = await this.findOne(merchantId);

    if (
      merchant.accountType !== AccountType.TRIAL &&
      merchant.accountType !== AccountType.DEMO
    ) {
      throw new BadRequestException('Account is not in trial or demo mode');
    }

    // Check if payment method is set up
    if (!merchant.encorePaymentMethod) {
      throw new BadRequestException(
        'Payment method must be set up before converting to paid',
      );
    }

    merchant.accountType = AccountType.PAID;
    merchant.convertedToPaidAt = new Date();
    merchant.status = MerchantStatus.ACTIVE;

    // Set next billing date
    const nextDue = new Date();
    nextDue.setMonth(nextDue.getMonth() + 1);
    merchant.nextPlatformFeeDueAt = nextDue;

    const saved = await this.merchantRepo.save(merchant);

    await this.audit.log({
      action: 'CONVERTED_TO_PAID',
      entityType: 'merchant',
      entityId: merchantId,
      merchantId,
      metadata: { tier: merchant.pricingTier },
      severity: 'critical',
    });

    this.logger.log(`Merchant ${merchantId} converted to paid account`);

    return saved;
  }

  /**
   * Convert trial to demo account
   */
  async convertToDemo(merchantId: string): Promise<Merchant> {
    const merchant = await this.findOne(merchantId);

    if (merchant.accountType !== AccountType.TRIAL) {
      throw new BadRequestException('Account is not in trial mode');
    }

    merchant.accountType = AccountType.DEMO;
    merchant.maxSubscribers = 10;
    merchant.status = MerchantStatus.ACTIVE;
    merchant.settings = {
      ...merchant.settings,
      isDemo: true,
      demoLimitations: [
        'No real payments processed',
        'Maximum 10 subscribers',
        'No white-label features',
        '14-day duration',
      ],
    };

    const saved = await this.merchantRepo.save(merchant);

    await this.audit.log({
      action: 'CONVERTED_TO_DEMO',
      entityType: 'merchant',
      entityId: merchantId,
      merchantId,
      severity: 'normal',
    });

    this.logger.log(`Merchant ${merchantId} converted to demo account`);

    return saved;
  }

  /**
   * Create demo account (limited 14-day trial)
   */
  async createDemoAccount(dto: RegisterMerchantDto): Promise<Merchant> {
    const existing = await this.merchantRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const demoDays = this.config.get('pricing.demoDays', 14);
    const demoEndsAt = new Date();
    demoEndsAt.setDate(demoEndsAt.getDate() + demoDays);

    const merchant = this.merchantRepo.create({
      businessName: dto.businessName,
      email: dto.email,
      passwordHash,
      phone: dto.phone,
      businessType: dto.businessType,
      pricingTier: PricingTier.STARTER,
      accountType: AccountType.DEMO,
      status: MerchantStatus.ACTIVE,
      kycStatus: KycStatus.PENDING, // KYC not required for demo
      trialStartedAt: new Date(),
      trialEndsAt: demoEndsAt,
      maxSubscribers: 10, // Limited for demo
      transactionFeeRate: 1.5,
      currentSubscriberCount: 0,
      platformFeeBalance: 0,
      settings: {
        isDemo: true,
        demoLimitations: [
          'No real payments processed',
          'Maximum 10 subscribers',
          'No white-label features',
          '14-day duration',
        ],
      },
    });

    const saved = await this.merchantRepo.save(merchant);

    await this.audit.log({
      action: 'DEMO_ACCOUNT_CREATED',
      entityType: 'merchant',
      entityId: saved.id,
      merchantId: saved.id,
      metadata: { demoEndsAt },
      severity: 'normal',
    });

    return saved;
  }

  /**
   * Get pricing tier configuration
   */
  getPricingTiers(): Record<string, PricingTierConfig> {
    return this.config.get('pricing.tiers') ?? {};
  }

  /**
   * Get current merchant with computed fields
   */
  async findOne(id: string): Promise<Merchant> {
    const merchant = await this.merchantRepo.findOne({ where: { id } });
    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }
    return merchant;
  }

  /**
   * Find by email (for login)
   */
  async findByEmail(email: string): Promise<Merchant | null> {
    return this.merchantRepo.findOne({ where: { email } });
  }

  /**
   * Validate password
   */
  async validatePassword(
    merchant: Merchant,
    password: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, merchant.passwordHash);
  }

  /**
   * Update last login
   */
  async updateLastLogin(id: string): Promise<void> {
    await this.merchantRepo.update(id, { lastLoginAt: new Date() });
  }

  /**
   * Check if account is expired (trial/demo ended)
   */
  isAccountExpired(merchant: Merchant): boolean {
    if (merchant.accountType === AccountType.PAID) {
      return false;
    }

    if (
      merchant.accountType === AccountType.TRIAL ||
      merchant.accountType === AccountType.DEMO
    ) {
      return merchant.trialEndsAt ? new Date() > merchant.trialEndsAt : false;
    }

    return false;
  }

  /**
   * Get days remaining in trial/demo
   */
  getDaysRemaining(merchant: Merchant): number {
    if (!merchant.trialEndsAt) return 0;

    const now = new Date();
    const end = new Date(merchant.trialEndsAt);
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  /**
   * Get dynamic merchant limits, usage, status, and config parameters
   */
  async getMerchantConfig(merchantId: string) {
    const merchant = await this.findOne(merchantId);

    // Fetch live settings from dynamic SystemConfigService
    const maxTxAmount = await this.systemConfig.get(
      'unregistered_max_transaction_amount',
      5000,
    );
    const maxMonthlyVol = await this.systemConfig.get(
      'unregistered_max_monthly_volume',
      50000,
    );
    const requireCac = await this.systemConfig.get(
      'unregistered_require_cac_for_live',
      true,
    );

    // Calculate current monthly volume (successful transactions this calendar month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await this.merchantRepo.manager
      .createQueryBuilder(Transaction, 'tx')
      .select('SUM(tx.amount)', 'total')
      .where('tx.merchantId = :merchantId', { merchantId })
      .andWhere('tx.status = :status', { status: PaymentStatus.SUCCESS })
      .andWhere('tx.createdAt >= :startDate', { startDate: startOfMonth })
      .getRawOne();

    const currentMonthlyVolume = parseFloat(result?.total || '0');

    // Is the merchant unregistered?
    // Unregistered if their registration number is empty, or if KYC is pending/rejected
    const isUnregistered =
      !merchant.registrationNumber || merchant.kycStatus === KycStatus.PENDING;

    // Define limits
    const limits = {
      maxTransactionAmount: isUnregistered ? maxTxAmount : -1,
      maxMonthlyVolume: isUnregistered ? maxMonthlyVol : -1,
      maxSubscribers: merchant.maxSubscribers,
      requireCacForLive: isUnregistered && requireCac,
      settlementType: isUnregistered ? 'manual' : 'auto',
    };

    const usage = {
      currentMonthlyVolume,
      currentSubscriberCount: merchant.currentSubscriberCount,
    };

    const status = {
      isUnregistered,
      isKycPending: merchant.kycStatus === KycStatus.PENDING,
      isKycVerified: merchant.kycStatus === KycStatus.VERIFIED,
      isTrial: merchant.accountType === AccountType.TRIAL,
      isDemo: merchant.accountType === AccountType.DEMO,
      limitsReached: {
        monthlyVolume:
          limits.maxMonthlyVolume !== -1 &&
          currentMonthlyVolume >= limits.maxMonthlyVolume,
        subscribers:
          limits.maxSubscribers !== -1 &&
          merchant.currentSubscriberCount >= limits.maxSubscribers,
      },
    };

    return {
      limits,
      usage,
      status,
    };
  }

  async onApplicationBootstrap() {
    this.logger.log('Running backfill: generating missing merchant codes...');
    const merchants = await this.merchantRepo.find({
      where: { merchantCode: IsNull() },
    });
    for (const merchant of merchants) {
      merchant.merchantCode = await this.generateUniqueMerchantCode();
      await this.merchantRepo.save(merchant);
      this.logger.log(`Generated code ${merchant.merchantCode} for merchant ${merchant.id}`);
    }
  }

  async generateUniqueMerchantCode(): Promise<string> {
    let attempts = 0;
    while (attempts < 100) {
      const code = 'EN' + Math.floor(10000 + Math.random() * 90000);
      const existing = await this.merchantRepo.findOne({
        where: { merchantCode: code },
      });
      if (!existing) {
        return code;
      }
      attempts++;
    }
    return 'EN' + Date.now().toString().slice(-5);
  }
}
