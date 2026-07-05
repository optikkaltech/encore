import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { SubscriptionStatus, PaymentMethod } from '../../../shared/enums';
import { Merchant } from '../../merchants/entities';
import { Subscription } from './subscription.entity';
import {
  EncryptionTransformer,
  JsonEncryptionTransformer,
} from '../../../common/utils/encryption.transformer';
import { hashEmail } from '../../../common/utils/security.utils';

/**
 * Subscriber entity - customers of merchants.
 * Scoped to merchant for multi-tenancy isolation.
 *
 * NDPR Compliance: Personal data encrypted at rest.
 * PCI-DSS Compliance: No card data stored - only tokens/references.
 */
@Entity('subscribers')
@Index(['merchantId', 'email'], { unique: true })
@Index(['merchantId', 'status'])
@Index(['emailHash'])
@Index(['merchantId', 'emailHash'], { unique: true })
@Index(['virtualAccountNumber'], {
  unique: true,
  where: '"virtualAccountNumber" IS NOT NULL',
})
export class Subscriber {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Multi-tenancy: every subscriber belongs to a merchant
  @Column({ type: 'uuid' })
  merchantId: string;

  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant;

  // Personal Info (encrypted at rest for NDPR)
  @Column({
    type: 'text',
    transformer: new EncryptionTransformer(),
    comment: 'NDPR: Encrypted PII',
  })
  email: string;

  /**
   * Keyed SHA-256 hash of the email — used for lookups since the email
   * column is AES-GCM encrypted with a random IV (not directly searchable).
   * NDPR safe: hash alone cannot reveal the original email without the key.
   */
  @Column({ type: 'varchar', length: 64, nullable: true })
  emailHash: string;

  @Column({
    type: 'text',
    transformer: new EncryptionTransformer(),
    comment: 'NDPR: Encrypted PII',
  })
  firstName: string;

  @Column({
    type: 'text',
    transformer: new EncryptionTransformer(),
    comment: 'NDPR: Encrypted PII',
  })
  lastName: string;

  @Column({
    type: 'text',
    transformer: new EncryptionTransformer(),
    comment: 'NDPR: Encrypted PII',
  })
  phone: string;

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

  // Subscription status
  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  // Payment method - NO CARD DATA stored (PCI-DSS compliance)
  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.CARD })
  paymentMethod: PaymentMethod;

  // Card token (from Nomba) - NOT the actual card number
  @Column({ type: 'varchar', length: 255, nullable: true })
  cardToken: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  cardLastFour: string; // Last 4 digits only

  @Column({ type: 'varchar', length: 20, nullable: true })
  cardExpiry: string; // MM/YY format

  // Direct Debit Mandate
  @Column({ type: 'varchar', length: 255, nullable: true })
  mandateId: string; // Nomba mandate reference

  @Column({ type: 'varchar', length: 50, nullable: true })
  bankCode: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  bankName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  accountNumber: string; // Masked account number

  // Virtual Account for reconciliation (Smart Reconciliation feature)
  @Column({ type: 'varchar', length: 50, nullable: true })
  virtualAccountNumber: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  virtualAccountId: string | null; // Nomba virtual account ID

  @Column({ type: 'varchar', length: 255, nullable: true })
  virtualAccountBank: string | null;

  // Billing dates
  @Column({ type: 'timestamp', nullable: true })
  nextBillingDate: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastBillingDate: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  trialEndsAt: Date | null;

  // Failed payment tracking
  @Column({ type: 'integer', default: 0 })
  consecutiveFailures: number;

  @Column({ type: 'timestamp', nullable: true })
  lastFailureAt: Date;

  // Portal access
  @Column({ type: 'varchar', length: 255, nullable: true })
  portalPasswordHash: string;

  @Column({ type: 'timestamp', nullable: true })
  lastPortalLoginAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  portalInviteToken: string | null; // One-time token for subscriber to set their portal password

  @Column({ type: 'timestamp', nullable: true })
  portalInviteExpires: Date | null;

  // Metadata
  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  // Relationships
  @OneToMany(() => Subscription, (subscription) => subscription.subscriber)
  subscriptions: Subscription[];

  // Timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date; // Soft delete

  @BeforeInsert()
  @BeforeUpdate()
  generateEmailHash() {
    if (this.email) {
      this.emailHash = hashEmail(this.email.toLowerCase().trim());
    }
  }
}
