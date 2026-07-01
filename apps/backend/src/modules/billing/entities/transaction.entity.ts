import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PaymentStatus, PaymentMethod } from '../../../shared/enums';
import { Merchant } from '../../merchants/entities';
import { Subscriber } from '../../subscribers/entities';
import { Subscription } from '../../subscribers/entities';

/**
 * Transaction entity - records all payment attempts.
 * Immutable audit trail for PCI-DSS and reconciliation.
 */
@Entity('transactions')
@Index(['merchantId', 'createdAt'])
@Index(['merchantId', 'status'])
@Index(['merchantId', 'subscriberId'])
@Index(['nombaReference'], {
  unique: true,
  where: '"nombaReference" IS NOT NULL',
})
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Multi-tenancy
  @Column({ type: 'uuid' })
  merchantId: string;

  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant;

  // Relationships
  @Column({ type: 'uuid' })
  subscriberId: string;

  @ManyToOne(() => Subscriber, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscriberId' })
  subscriber: Subscriber;

  @Column({ type: 'uuid' })
  subscriptionId: string;

  @ManyToOne(() => Subscription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscriptionId' })
  subscription: Subscription;

  // Transaction details
  @Column({ type: 'varchar', length: 100 })
  type: 'subscription' | 'setup_fee' | 'usage_charge' | 'one_time' | 'refund';

  @Column({ type: 'decimal', precision: 19, scale: 4 })
  amount: number;

  @Column({ type: 'varchar', length: 10, default: 'NGN' })
  currency: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  // Nomba Integration - references only (PCI-DSS compliant)
  @Column({ type: 'varchar', length: 255, nullable: true })
  nombaReference: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nombaTransactionId: string;

  @Column({ type: 'text', nullable: true })
  nombaResponse: string; // JSON response from Nomba

  // Retry tracking
  @Column({ type: 'integer', default: 0 })
  retryCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastRetryAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextRetryAt: Date;

  // Failure details
  @Column({ type: 'varchar', length: 50, nullable: true })
  failureCode: string;

  @Column({ type: 'text', nullable: true })
  failureMessage: string;

  // Billing period reference
  @Column({ type: 'timestamp', nullable: true })
  billingPeriodStart: Date;

  @Column({ type: 'timestamp', nullable: true })
  billingPeriodEnd: Date;

  // Invoice generation
  @Column({ type: 'uuid', nullable: true })
  invoiceId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  invoiceNumber: string;

  // Metadata
  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  // Timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  processedAt?: Date | null; // When Nomba webhook confirmed
}
