import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { Merchant } from '../../modules/merchants/entities/merchant.entity';
import { EmailService } from '../email/email.service';
import { SecureLogger } from '../../common/services/secure-logger.service';
import { AuditService } from '../audit/audit.service';
import {
  AccountType,
  KycStatus,
  MerchantStatus,
  PricingTier,
} from '../../shared/enums';

export interface JwtPayload {
  sub: string; // merchantId
  merchantId?: string;
  email: string;
  accountType: string;
  pricingTier: string;
  isEmailVerified: boolean;
  iat?: number;
  exp?: number;
}

export interface LoginResult {
  access_token: string;
  refresh_token: string;
  merchant: {
    id: string;
    businessName: string;
    email: string;
    accountType: string;
    pricingTier: string;
    isEmailVerified: boolean;
    kycStatus: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new SecureLogger();

  constructor(
    @InjectRepository(Merchant)
    private readonly merchantRepo: Repository<Merchant>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Validate merchant credentials
   */
  async validateMerchant(
    email: string,
    password: string,
  ): Promise<Merchant | null> {
    const merchant = await this.merchantRepo.findOne({ where: { email } });

    if (!merchant) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      merchant.passwordHash,
    );

    if (!isPasswordValid) {
      return null;
    }

    return merchant;
  }

  /**
   * Login with email/password
   */
  async login(email: string, password: string): Promise<LoginResult> {
    const merchant = await this.validateMerchant(email, password);

    if (!merchant) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.loginMerchant(merchant);
  }

  /**
   * OAuth login - bypass password check
   */
  async loginOAuth(merchantId: string): Promise<LoginResult> {
    const merchant = await this.merchantRepo.findOne({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new UnauthorizedException('Merchant not found');
    }

    return this.loginMerchant(merchant);
  }

  /**
   * Internal login helper
   */
  private async loginMerchant(merchant: Merchant): Promise<LoginResult> {
    if (merchant.status === MerchantStatus.SUSPENDED) {
      throw new UnauthorizedException('Account suspended. Contact support.');
    }

    // Update last login
    merchant.lastLoginAt = new Date();
    await this.merchantRepo.save(merchant);

    // Generate tokens
    const tokens = await this.generateTokens(merchant);

    // Audit log
    await this.audit.log({
      action: 'LOGIN',
      entityType: 'merchant',
      entityId: merchant.id,
      merchantId: merchant.id,
      severity: 'normal',
    });

    this.logger.log(`Merchant logged in: ${merchant.id}`);

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      merchant: this.sanitizeMerchant(merchant),
    };
  }

  /**
   * Register new merchant (manual signup)
   */
  async registerManual(
    businessName: string,
    email: string,
    password: string,
    phone: string,
    businessType: string,
  ): Promise<Merchant> {
    // Check existing
    const existing = await this.merchantRepo.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate verification token
    const emailVerificationToken = randomBytes(32).toString('hex');

    // Create merchant
    const trialDays = 30;
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    const merchantCode = await this.generateUniqueMerchantCode();

    const merchant = this.merchantRepo.create({
      merchantCode,
      businessName,
      email,
      passwordHash,
      phone,
      businessType: businessType as any,
      pricingTier: PricingTier.STARTER,
      accountType: AccountType.TRIAL,
      status: MerchantStatus.PENDING,
      kycStatus: KycStatus.PENDING,
      emailVerificationToken,
      isEmailVerified: false,
      trialStartedAt: new Date(),
      trialEndsAt,
      maxSubscribers: 50,
      transactionFeeRate: 1.5,
      currentSubscriberCount: 0,
      platformFeeBalance: 0,
      settings: {
        notifications: { email: true, sms: true },
        billing: { autoRetry: true, retryAttempts: 3 },
      },
    });

    const saved = await this.merchantRepo.save(merchant);

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(
        email,
        emailVerificationToken,
        businessName,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to send verification email to ${email}: ${error.message}`,
        error.stack,
      );
    }

    // Audit log
    await this.audit.log({
      action: 'MERCHANT_REGISTERED',
      entityType: 'merchant',
      entityId: saved.id,
      merchantId: saved.id,
      metadata: { tier: PricingTier.STARTER, trialEndsAt },
      severity: 'normal',
    });

    this.logger.log(`Merchant registered: ${saved.id}`);

    return saved;
  }

  /**
   * Handle Google OAuth signup/login
   */
  async handleGoogleAuth(
    googleId: string,
    email: string,
    businessName: string,
    picture?: string,
  ): Promise<{ merchant: Merchant; isNew: boolean }> {
    // Check if merchant exists by Google ID
    let merchant = await this.merchantRepo.findOne({ where: { googleId } });

    if (merchant) {
      // Existing merchant - update last login
      merchant.lastLoginAt = new Date();
      await this.merchantRepo.save(merchant);

      return { merchant, isNew: false };
    }

    // Check if email exists (link accounts)
    merchant = await this.merchantRepo.findOne({ where: { email } });

    if (merchant) {
      // Link Google to existing account
      merchant.googleId = googleId;
      if (picture) {
        merchant.settings = { ...merchant.settings, googlePicture: picture };
      }
      await this.merchantRepo.save(merchant);

      return { merchant, isNew: false };
    }

    // Create new merchant from Google
    const trialDays = 30;
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    const merchantCode = await this.generateUniqueMerchantCode();

    merchant = this.merchantRepo.create({
      merchantCode,
      googleId,
      businessName,
      email,
      // No password for OAuth users
      passwordHash: '',
      pricingTier: PricingTier.STARTER,
      accountType: AccountType.TRIAL,
      status: MerchantStatus.PENDING,
      kycStatus: KycStatus.PENDING,
      isEmailVerified: true, // Google already verified
      trialStartedAt: new Date(),
      trialEndsAt,
      maxSubscribers: 50,
      transactionFeeRate: 1.5,
      currentSubscriberCount: 0,
      platformFeeBalance: 0,
      settings: {
        googlePicture: picture,
        oauthProvider: 'google',
        notifications: { email: true, sms: true },
        onboardingCompleted: false, // Need to complete onboarding
      },
    });

    const saved = await this.merchantRepo.save(merchant);

    // Send welcome email
    const loginUrl = `${process.env.FRONTEND_URL}/login`;
    try {
      await this.emailService.sendWelcomeEmail(email, businessName, loginUrl);
    } catch (error: any) {
      this.logger.error(
        `Failed to send welcome email to ${email}: ${error.message}`,
        error.stack,
      );
    }

    // Audit log
    await this.audit.log({
      action: 'MERCHANT_REGISTERED_GOOGLE',
      entityType: 'merchant',
      entityId: saved.id,
      merchantId: saved.id,
      metadata: { tier: PricingTier.STARTER },
      severity: 'normal',
    });

    this.logger.log(`Merchant registered via Google: ${saved.id}`);

    return { merchant: saved, isNew: true };
  }

  /**
   * Verify email address
   */
  async verifyEmail(token: string): Promise<void> {
    const merchant = await this.merchantRepo.findOne({
      where: { emailVerificationToken: token },
    });

    if (!merchant) {
      throw new BadRequestException('Invalid verification token');
    }

    if (merchant.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    merchant.isEmailVerified = true;
    merchant.emailVerificationToken = null as any;
    merchant.status = MerchantStatus.ACTIVE;

    await this.merchantRepo.save(merchant);

    // Send welcome email
    const loginUrl = `${process.env.FRONTEND_URL}/login`;
    try {
      await this.emailService.sendWelcomeEmail(
        merchant.email,
        merchant.businessName,
        loginUrl,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to send welcome email to ${merchant.email}: ${error.message}`,
        error.stack,
      );
    }

    await this.audit.log({
      action: 'EMAIL_VERIFIED',
      entityType: 'merchant',
      entityId: merchant.id,
      merchantId: merchant.id,
      severity: 'normal',
    });

    this.logger.log(`Email verified: ${merchant.id}`);
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const merchant = await this.merchantRepo.findOne({ where: { email } });

    if (!merchant) {
      // Don't reveal if email exists
      return;
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpires = new Date();
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 1);

    merchant.passwordResetToken = resetToken;
    merchant.passwordResetExpires = resetTokenExpires;

    await this.merchantRepo.save(merchant);

    // Send reset email
    try {
      this.logger.log(
        `[PasswordReset] Sending to=${email} provider=${process.env.EMAIL_PROVIDER} frontendUrl=${process.env.FRONTEND_URL}`,
      );
      await this.emailService.sendPasswordResetEmail(email, resetToken);
      this.logger.log(`[PasswordReset] Email dispatched to ${email}`);
    } catch (error: any) {
      this.logger.error(
        `[PasswordReset] FAILED to send email to ${email}: ${error.message}`,
        error.stack,
      );
    }

    await this.audit.log({
      action: 'PASSWORD_RESET_REQUESTED',
      entityType: 'merchant',
      entityId: merchant.id,
      merchantId: merchant.id,
      severity: 'normal',
    });

    this.logger.log(`Password reset requested: ${merchant.id}`);
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const merchant = await this.merchantRepo.findOne({
      where: { passwordResetToken: token },
    });

    if (!merchant || !merchant.passwordResetExpires) {
      throw new BadRequestException('Invalid reset token');
    }

    if (new Date() > merchant.passwordResetExpires) {
      throw new BadRequestException('Reset token expired');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    merchant.passwordHash = passwordHash;
    merchant.passwordResetToken = null as any;
    merchant.passwordResetExpires = null as any;

    await this.merchantRepo.save(merchant);

    await this.audit.log({
      action: 'PASSWORD_RESET_COMPLETED',
      entityType: 'merchant',
      entityId: merchant.id,
      merchantId: merchant.id,
      severity: 'critical',
    });

    this.logger.log(`Password reset completed: ${merchant.id}`);
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(
    merchant: Merchant,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: merchant.id,
      merchantId: merchant.id,
      email: merchant.email,
      accountType: merchant.accountType,
      pricingTier: merchant.pricingTier,
      isEmailVerified: merchant.isEmailVerified,
    };

    const accessToken = this.jwtService.sign(payload);

    // Generate refresh token (longer expiry)
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ access_token: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken);

      const merchant = await this.merchantRepo.findOne({
        where: { id: payload.sub },
      });

      if (!merchant || merchant.status === MerchantStatus.SUSPENDED) {
        throw new UnauthorizedException('Invalid token');
      }

      const newPayload: JwtPayload = {
        sub: merchant.id,
        email: merchant.email,
        accountType: merchant.accountType,
        pricingTier: merchant.pricingTier,
        isEmailVerified: merchant.isEmailVerified,
      };

      const access_token = this.jwtService.sign(newPayload);

      return { access_token };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateUniqueMerchantCode(): Promise<string> {
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

  /**
   * Sanitize merchant for response
   */
  private sanitizeMerchant(merchant: Merchant) {
    return {
      id: merchant.id,
      merchantCode: merchant.merchantCode,
      businessName: merchant.businessName,
      email: merchant.email,
      accountType: merchant.accountType,
      pricingTier: merchant.pricingTier,
      isEmailVerified: merchant.isEmailVerified,
      kycStatus: merchant.kycStatus,
    };
  }
}
