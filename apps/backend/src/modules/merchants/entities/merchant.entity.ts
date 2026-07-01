import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import {
  MerchantStatus,
  KycStatus,
  BusinessType,
  PricingTier,
  AccountType,
} from '../../../shared/enums';
import {
  EncryptionTransformer,
  JsonEncryptionTransformer,
} from '../../../common/utils/encryption.transformer';

/**
 * Merchant entity - the top-level tenant in the multi-tenant architecture.
 * Every other entity belongs to a merchant, ensuring strict data isolation.
 */
@Entity('merchants')
@Index(['email'], { unique: true })
@Index(['nombaAccountId'], {
  unique: true,
  where: '"nombaAccountId" IS NOT NULL',
})
export class Merchant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, nullable: true, unique: true })
  merchantCode: string | null;

  @Column({ type: 'varchar', length: 255 })
  businessName: string;

  @Column({
    type: 'text',
    unique: true,
    transformer: new EncryptionTransformer(),
    comment: 'NDPR: Encrypted PII',
  })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'enum', enum: BusinessType, nullable: true })
  businessType: BusinessType;

  @Column({ type: 'varchar', length: 50, nullable: true })
  registrationNumber: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  taxId: string | null;

  @Column({
    type: 'text',
    nullable: true,
    transformer: new EncryptionTransformer(),
    comment: 'NDPR: Encrypted PII',
  })
  phone: string | null;

  @Column({
    type: 'text',
    nullable: true,
    transformer: new EncryptionTransformer(),
    comment: 'NDPR: Encrypted PII',
  })
  address: string;

  @Column({
    type: 'text',
    nullable: true,
    transformer: new EncryptionTransformer(),
    comment: 'NDPR: Encrypted PII',
  })
  city: string;

  @Column({
    type: 'text',
    nullable: true,
    transformer: new EncryptionTransformer(),
    comment: 'NDPR: Encrypted PII',
  })
  state: string;

  @Column({
    type: 'text',
    nullable: true,
    transformer: new EncryptionTransformer(),
    comment: 'NDPR: Encrypted PII',
  })
  country: string;

  @Column({
    type: 'enum',
    enum: MerchantStatus,
    default: MerchantStatus.PENDING,
  })
  status: MerchantStatus;

  @Column({ type: 'enum', enum: KycStatus, default: KycStatus.PENDING })
  kycStatus: KycStatus;

  @Column({ type: 'enum', enum: PricingTier, default: PricingTier.STARTER })
  pricingTier: PricingTier;

  @Column({ type: 'enum', enum: AccountType, default: AccountType.TRIAL })
  accountType: AccountType;

  // Trial / Demo Account Management
  @Column({ type: 'timestamp', nullable: true })
  trialStartedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  trialEndsAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  convertedToPaidAt: Date;

  // Encore Platform Billing (what merchant pays us)
  @Column({ type: 'varchar', length: 255, nullable: true })
  encorePaymentMethod: 'card' | 'direct_debit' | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  encoreCardToken: string; // Nomba token for platform fee billing

  @Column({ type: 'varchar', length: 255, nullable: true })
  encoreMandateId: string; // Direct debit mandate for platform fees

  @Column({ type: 'timestamp', nullable: true })
  lastPlatformFeeChargedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextPlatformFeeDueAt: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  platformFeeBalance: number; // Outstanding balance

  @Column({ type: 'int', default: 0 })
  failedPlatformFeeAttempts: number; // Consecutive failures

  @Column({ type: 'timestamp', nullable: true })
  gracePeriodEndsAt: Date; // For suspended accounts

  // Subscriber limits based on pricing tier
  @Column({ type: 'int', default: 50 })
  maxSubscribers: number;

  @Column({ type: 'int', default: 0 })
  currentSubscriberCount: number;

  // Transaction fee rate (customizable for enterprise)
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1.0 })
  transactionFeeRate: number; // 0.5% - 1.5%

  // Nomba Integration - PCI-DSS: No card data stored here
  @Column({ type: 'varchar', length: 255, nullable: true })
  nombaAccountId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nombaApiKeyEncrypted: string; // Encrypted at rest (NDPR compliance)

  @Column({ type: 'varchar', length: 255, nullable: true })
  nombaSecretKeyEncrypted: string; // Encrypted at rest (NDPR compliance)

  // Branding for white-label subscriber portal
  @Column({ type: 'varchar', length: 255, nullable: true })
  brandLogoUrl: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  brandPrimaryColor: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customDomain: string;

  @Column({ type: 'boolean', default: false })
  isWhiteLabelEnabled: boolean;

  // Webhook configuration
  @Column({ type: 'text', nullable: true })
  webhookUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  webhookSecret: string;

  // Authentication
  @Column({ type: 'varchar', length: 255, nullable: true })
  googleId: string; // For OAuth users

  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  emailVerificationToken: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordResetToken: string;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetExpires: Date;

  // Settings
  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, unknown>;

  // Timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;
}
