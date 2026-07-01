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
import { BillingFrequency } from '../../../shared/enums';
import { Merchant } from '../../merchants/entities';

/**
 * Plan entity - billing plans created by merchants.
 * Scoped to merchant for multi-tenancy isolation.
 */
@Entity('plans')
@Index(['merchantId', 'code'], { unique: true })
@Index(['merchantId', 'isActive'])
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Multi-tenancy: every plan belongs to a merchant
  @Column({ type: 'uuid' })
  merchantId: string;

  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  code: string; // Internal reference code

  @Column({ type: 'text', nullable: true })
  description: string;

  // Billing configuration
  @Column({ type: 'decimal', precision: 19, scale: 4 })
  amount: number;

  @Column({
    type: 'enum',
    enum: BillingFrequency,
    default: BillingFrequency.MONTHLY,
  })
  frequency: BillingFrequency;

  @Column({ type: 'integer', nullable: true })
  customDays: number; // For custom frequency

  @Column({ type: 'varchar', length: 10, default: 'NGN' })
  currency: string;

  // Trial and setup
  @Column({ type: 'integer', default: 0 })
  trialDays: number;

  @Column({ type: 'decimal', precision: 19, scale: 4, default: 0 })
  setupFee: number;

  // Proration for mid-cycle changes
  @Column({ type: 'boolean', default: true })
  isProrated: boolean;

  // Plan status
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean; // Default plan for new subscribers

  // Metadata
  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  // Usage-based billing configuration
  @Column({ type: 'boolean', default: false })
  isUsageBased: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  usageMetric: string; // e.g., 'credits', 'api_calls', 'storage_gb'

  @Column({ type: 'decimal', precision: 19, scale: 4, nullable: true })
  usageRate: number; // Cost per unit

  // Timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date; // Soft delete
}
