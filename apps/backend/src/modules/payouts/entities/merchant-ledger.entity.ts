import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { LedgerEntryType } from '../../../shared/enums';
import { Merchant } from '../../merchants/entities/merchant.entity';

/**
 * MerchantLedger — double-entry ledger for merchant revenue.
 *
 * Every successful subscriber payment creates a CREDIT entry.
 * Every payout (and its ₦50 platform fee) creates a DEBIT entry.
 * availableBalance = SUM(credit.amount) - SUM(debit.amount)
 *
 * This is the source of truth for balance; never derive it from
 * transactions alone to stay correct as the product evolves.
 */
@Entity('merchant_ledger')
@Index(['merchantId', 'createdAt'])
@Index(['merchantId', 'type'])
export class MerchantLedger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  merchantId: string;

  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant;

  @Column({ type: 'enum', enum: LedgerEntryType })
  type: LedgerEntryType;

  /**
   * Always stored as a positive number.
   * CREDIT = money received, DEBIT = money paid out / fee.
   */
  @Column({ type: 'decimal', precision: 19, scale: 4 })
  amount: number;

  @Column({ type: 'varchar', length: 10, default: 'NGN' })
  currency: string;

  /** Human-readable description of this entry */
  @Column({ type: 'varchar', length: 255 })
  description: string;

  /**
   * Reference to the source entity:
   * - CREDIT: transaction.id (subscriber payment)
   * - DEBIT:  payout.id (withdrawal) or 'fee:<payoutId>'
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  referenceId: string | null;

  /** 'transaction' | 'payout' | 'payout_fee' | 'refund' | 'adjustment' */
  @Column({ type: 'varchar', length: 50 })
  referenceType: string;

  /** Running balance snapshot for auditability (optional, kept for debugging) */
  @Column({ type: 'decimal', precision: 19, scale: 4, nullable: true })
  runningBalance: number | null;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}
