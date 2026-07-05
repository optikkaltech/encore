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
import { PayoutStatus } from '../../../shared/enums';
import { Merchant } from '../../merchants/entities/merchant.entity';

/**
 * Payout entity — records each merchant withdrawal request.
 * The net amount transferred = requestedAmount - platformFee (₦50).
 */
@Entity('payouts')
@Index(['merchantId', 'createdAt'])
@Index(['merchantId', 'status'])
@Index(['nombaReference'], { unique: true, where: '"nombaReference" IS NOT NULL' })
export class Payout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  merchantId: string;

  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant;

  // Amounts
  @Column({ type: 'decimal', precision: 19, scale: 4 })
  requestedAmount: number;

  @Column({ type: 'decimal', precision: 19, scale: 4, default: 50 })
  platformFee: number; // Encore's ₦50 flat payout fee

  @Column({ type: 'decimal', precision: 19, scale: 4 })
  netAmount: number; // requestedAmount - platformFee

  @Column({ type: 'varchar', length: 10, default: 'NGN' })
  currency: string;

  // Status lifecycle
  @Column({ type: 'enum', enum: PayoutStatus, default: PayoutStatus.PENDING })
  status: PayoutStatus;

  // Beneficiary bank details (snapshot at time of payout)
  @Column({ type: 'varchar', length: 255 })
  bankAccountName: string;

  @Column({ type: 'varchar', length: 50 })
  bankAccountNumber: string;

  @Column({ type: 'varchar', length: 20 })
  bankCode: string;

  @Column({ type: 'varchar', length: 100 })
  bankName: string;

  // Nomba transfer reference
  @Column({ type: 'varchar', length: 255, nullable: true })
  nombaReference: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nombaTransactionId: string | null;

  @Column({ type: 'text', nullable: true })
  nombaResponse: string | null; // raw JSON

  // Failure tracking
  @Column({ type: 'text', nullable: true })
  failureReason: string | null;

  // Timeline
  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  failedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date | null;

  // Notes / internal
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
