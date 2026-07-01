import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { MerchantsService } from './merchants.service';
import {
  RegisterMerchantDto,
  SubmitKycDto,
  SetupPaymentMethodDto,
  SelectTierDto,
  InitiateCheckoutDto,
  VerifyCheckoutDto,
} from './dto/onboarding.dto';
import { Public, Secure } from '../../common/decorators/security.decorators';
import { Audit } from '../../core/audit';
import { TenantGuard } from '../../core/tenancy';
import { CurrentMerchant } from '../../core/tenancy';
import { maskEmail } from '../../common/utils/security.utils';

/**
 * Merchant Onboarding & Management Controller
 *
 * Handles:
 * - Registration (trial/demo/paid)
 * - KYC submission
 * - Payment method setup
 * - Tier selection and changes
 * - Account status and conversion
 */
@Controller('merchants')
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  /**
   * Step 1: Register new merchant (creates trial account by default)
   * POST /api/v1/merchants/register
   */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Audit({ action: 'MERCHANT_REGISTER', entityType: 'merchant' })
  async register(@Body() dto: RegisterMerchantDto) {
    const merchant = await this.merchantsService.register(dto);

    return {
      success: true,
      data: {
        id: merchant.id,
        merchantCode: merchant.merchantCode,
        businessName: merchant.businessName,
        email: maskEmail(merchant.email),
        accountType: merchant.accountType,
        pricingTier: merchant.pricingTier,
        trialEndsAt: merchant.trialEndsAt,
        daysRemaining: this.merchantsService.getDaysRemaining(merchant),
      },
      message:
        'Registration successful. Please verify your email and complete KYC.',
    };
  }

  /**
   * Create demo account (limited 14-day trial, no real payments)
   * POST /api/v1/merchants/demo
   */
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @Post('demo')
  @HttpCode(HttpStatus.CREATED)
  @Audit({ action: 'MERCHANT_DEMO_CREATE', entityType: 'merchant' })
  async createDemo(@Body() dto: RegisterMerchantDto) {
    const merchant = await this.merchantsService.createDemoAccount(dto);

    return {
      success: true,
      data: {
        id: merchant.id,
        merchantCode: merchant.merchantCode,
        businessName: merchant.businessName,
        email: maskEmail(merchant.email),
        accountType: merchant.accountType,
        demoEndsAt: merchant.trialEndsAt,
        daysRemaining: this.merchantsService.getDaysRemaining(merchant),
        limitations: merchant.settings?.['demoLimitations'] || [],
      },
      message:
        'Demo account created. Limited to 10 subscribers, no real payments.',
    };
  }

  /**
   * Step 2: Submit KYC information
   * POST /api/v1/merchants/kyc
   */
  @Post('kyc')
  @UseGuards(TenantGuard)
  @Secure()
  @Audit({ action: 'MERCHANT_KYC_SUBMIT', entityType: 'merchant' })
  async submitKyc(
    @CurrentMerchant() merchantId: string,
    @Body() dto: SubmitKycDto,
  ) {
    const merchant = await this.merchantsService.submitKyc(merchantId, dto);

    return {
      success: true,
      data: {
        id: merchant.id,
        kycStatus: merchant.kycStatus,
        message: 'KYC submitted successfully. Under review.',
      },
    };
  }

  /**
   * Step 3: Setup payment method for platform fees
   * POST /api/v1/merchants/payment-method
   */
  @Post('payment-method')
  @UseGuards(TenantGuard)
  @Secure()
  @Audit({ action: 'MERCHANT_PAYMENT_SETUP', entityType: 'merchant' })
  async setupPaymentMethod(
    @CurrentMerchant() merchantId: string,
    @Body() dto: SetupPaymentMethodDto,
  ) {
    const merchant = await this.merchantsService.setupPaymentMethod(
      merchantId,
      dto,
    );

    return {
      success: true,
      data: {
        id: merchant.id,
        paymentMethod: merchant.encorePaymentMethod,
        nextBillingDate: merchant.nextPlatformFeeDueAt,
      },
      message: 'Payment method configured successfully.',
    };
  }

  /**
   * Step 3.1: Initiate secure checkout redirect via Nomba
   * POST /api/v1/merchants/payment-method/initiate-checkout
   */
  @Post('payment-method/initiate-checkout')
  @UseGuards(TenantGuard)
  @Secure()
  @Audit({ action: 'MERCHANT_CHECKOUT_INITIATE', entityType: 'merchant' })
  async initiateCheckout(
    @CurrentMerchant() merchantId: string,
    @Body() dto: InitiateCheckoutDto,
  ) {
    return this.merchantsService.initiateCheckout(merchantId, dto);
  }

  /**
   * Step 3.2: Verify checkout transaction status
   * POST /api/v1/merchants/payment-method/verify-checkout
   */
  @Post('payment-method/verify-checkout')
  @UseGuards(TenantGuard)
  @Secure()
  @Audit({ action: 'MERCHANT_CHECKOUT_VERIFY', entityType: 'merchant' })
  async verifyCheckout(
    @CurrentMerchant() merchantId: string,
    @Body() dto: VerifyCheckoutDto,
  ) {
    return this.merchantsService.verifyCheckout(merchantId, dto);
  }

  /**
   * Convert trial/demo to paid account
   * POST /api/v1/merchants/convert-to-paid
   */
  @Post('convert-to-paid')
  @UseGuards(TenantGuard)
  @Secure()
  @Audit({
    action: 'MERCHANT_CONVERT_PAID',
    entityType: 'merchant',
    severity: 'critical',
  })
  async convertToPaid(@CurrentMerchant() merchantId: string) {
    const merchant = await this.merchantsService.convertToPaid(merchantId);

    return {
      success: true,
      data: {
        id: merchant.id,
        accountType: merchant.accountType,
        pricingTier: merchant.pricingTier,
        nextBillingDate: merchant.nextPlatformFeeDueAt,
      },
      message: 'Account converted to paid. Welcome to Encore!',
    };
  }

  /**
   * Convert trial to demo account
   * POST /api/v1/merchants/convert-to-demo
   */
  @Post('convert-to-demo')
  @UseGuards(TenantGuard)
  @Secure()
  @Audit({ action: 'MERCHANT_CONVERT_DEMO', entityType: 'merchant' })
  async convertToDemo(@CurrentMerchant() merchantId: string) {
    const merchant = await this.merchantsService.convertToDemo(merchantId);

    return {
      success: true,
      data: {
        id: merchant.id,
        accountType: merchant.accountType,
      },
      message: 'Account converted to demo successfully.',
    };
  }

  /**
   * Select or change pricing tier
   * POST /api/v1/merchants/select-tier
   */
  @Post('select-tier')
  @UseGuards(TenantGuard)
  @Secure()
  @Audit({ action: 'MERCHANT_TIER_SELECT', entityType: 'merchant' })
  async selectTier(
    @CurrentMerchant() merchantId: string,
    @Body() dto: SelectTierDto,
  ) {
    const merchant = await this.merchantsService.selectTier(merchantId, dto);
    const tiers = this.merchantsService.getPricingTiers();
    const tierConfig = tiers[dto.tier];

    return {
      success: true,
      data: {
        id: merchant.id,
        pricingTier: merchant.pricingTier,
        monthlyFee: tierConfig?.monthlyFee || 0,
        maxSubscribers: tierConfig?.maxSubscribers || 0,
        transactionFeeRate: tierConfig?.transactionFeeRate || 1.5,
        features: tierConfig?.features || [],
      },
      message: `Tier changed to ${dto.tier}. Changes take effect immediately.`,
    };
  }

  /**
   * Get available pricing tiers
   * GET /api/v1/merchants/pricing-tiers
   */
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @Get('pricing-tiers')
  getPricingTiers() {
    const tiers = this.merchantsService.getPricingTiers();

    return {
      success: true,
      data: tiers,
    };
  }

  /**
   * Get current merchant profile and status
   * GET /api/v1/merchants/me
   */
  @Get('me')
  @UseGuards(TenantGuard)
  @Secure()
  async getProfile(@CurrentMerchant() merchantId: string) {
    const merchant = await this.merchantsService.findOne(merchantId);
    const tiers = this.merchantsService.getPricingTiers();
    const tierConfig = tiers[merchant.pricingTier];

    return {
      success: true,
      data: {
        id: merchant.id,
        merchantCode: merchant.merchantCode,
        businessName: merchant.businessName,
        email: maskEmail(merchant.email),
        status: merchant.status,
        kycStatus: merchant.kycStatus,
        accountType: merchant.accountType,
        pricingTier: merchant.pricingTier,
        maxSubscribers: merchant.maxSubscribers,
        currentSubscriberCount: merchant.currentSubscriberCount,
        transactionFeeRate: merchant.transactionFeeRate,
        trialEndsAt: merchant.trialEndsAt,
        daysRemaining: this.merchantsService.getDaysRemaining(merchant),
        isExpired: this.merchantsService.isAccountExpired(merchant),
        nextBillingDate: merchant.nextPlatformFeeDueAt,
        platformFeeBalance: merchant.platformFeeBalance,
        features: tierConfig?.features || [],
        whiteLabelEnabled: merchant.isWhiteLabelEnabled,
        customDomain: merchant.customDomain,
        onboardingCompleted:
          merchant.accountType === 'demo' ||
          merchant.settings?.onboardingCompleted === true ||
          merchant.kycStatus !== 'pending',
      },
    };
  }

  /**
   * Get dynamic merchant limits, usage, and config parameters
   * GET /api/v1/merchants/me/config
   */
  @Get('me/config')
  @UseGuards(TenantGuard)
  @Secure()
  async getMerchantConfig(@CurrentMerchant() merchantId: string) {
    const config = await this.merchantsService.getMerchantConfig(merchantId);
    return {
      success: true,
      data: config,
    };
  }

  /**
   * Get onboarding status (for frontend progress tracking)
   * GET /api/v1/merchants/onboarding-status
   */
  @Get('onboarding-status')
  @UseGuards(TenantGuard)
  @Secure()
  async getOnboardingStatus(@CurrentMerchant() merchantId: string) {
    const merchant = await this.merchantsService.findOne(merchantId);

    const steps = {
      registration: {
        completed: true,
        label: 'Account Created',
      },
      emailVerification: {
        completed: true, // Simplified - would check email verification
        label: 'Email Verified',
      },
      kycSubmission: {
        completed: merchant.kycStatus !== 'pending',
        label:
          merchant.kycStatus === 'verified' ? 'KYC Verified' : 'KYC Submitted',
        status: merchant.kycStatus,
      },
      paymentSetup: {
        completed: !!merchant.encorePaymentMethod,
        label: 'Payment Method Set',
        method: merchant.encorePaymentMethod,
      },
      tierSelection: {
        // Complete if: not on starter tier, OR on starter but paid account, OR demo account
        completed:
          merchant.pricingTier !== 'starter' ||
          (merchant.pricingTier === 'starter' &&
            merchant.accountType === 'paid') ||
          merchant.accountType === 'demo',
        label: 'Tier Selected',
        tier: merchant.pricingTier,
      },
    };

    const requiredStepsList = [
      steps.registration,
      steps.emailVerification,
      steps.kycSubmission,
      steps.tierSelection,
    ];
    const completedRequired = requiredStepsList.filter(
      (s) => s.completed,
    ).length;

    return {
      success: true,
      data: {
        steps,
        progress: Math.round(
          (completedRequired / requiredStepsList.length) * 100,
        ),
        isComplete: completedRequired === requiredStepsList.length,
        accountType: merchant.accountType,
        canGoLive:
          merchant.kycStatus === 'verified' && !!merchant.encorePaymentMethod,
      },
    };
  }
}
