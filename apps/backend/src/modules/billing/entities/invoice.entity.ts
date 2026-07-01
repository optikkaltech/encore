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
import { Merchant } from '../../merchants/entities';
import { Subscriber } from '../../subscribers/entities';

/**
 * Invoice entity - generated on successful payment.
 * NDPR: Contains encrypted customer data.
 */
@Entity('invoices')
@Index(['merchantId', 'invoiceNumber'], { unique: true })
@Index(['merchantId', 'subscriberId'])
@Index(['merchantId', 'createdAt'])
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Multi-tenancy
  @Column({ type: 'uuid' })
  merchantId: string;

  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant;

  // Invoice number (merchant-scoped)
  @Column({ type: 'varchar', length: 50 })
  invoiceNumber: string;

  // Customer details (snapshot at time of invoice for audit)
  @Column({ type: 'uuid' })
  subscriberId: string;

  @ManyToOne(() => Subscriber, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscriberId' })
  subscriber: Subscriber;

  @Column({ type: 'varchar', length: 255 })
  customerEmail: string;

  @Column({ type: 'varchar', length: 255 })
  customerName: string;

  // Line items (JSON array of billed items)
  @Column({ type: 'jsonb' })
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    type: 'subscription' | 'setup_fee' | 'usage' | 'discount';
  }[];

  // Financial summary
  @Column({ type: 'decimal', precision: 19, scale: 4 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 19, scale: 4, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 19, scale: 4, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 19, scale: 4 })
  totalAmount: number;

  @Column({ type: 'varchar', length: 10, default: 'NGN' })
  currency: string;

  // Payment reference
  @Column({ type: 'uuid' })
  transactionId: string;

  @Column({ type: 'timestamp', nullable: true })
  paidAt?: Date | null;

  @Column({ type: 'varchar', length: 50 })
  paymentMethod: string;

  // Invoice status
  @Column({ type: 'varchar', length: 20, default: 'sent' })
  status: 'draft' | 'sent' | 'paid' | 'void';

  // PDF generation
  @Column({ type: 'varchar', length: 255, nullable: true })
  pdfUrl: string;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  viewedAt: Date;

  // Billing period
  @Column({ type: 'timestamp', nullable: true })
  billingPeriodStart: Date;

  @Column({ type: 'timestamp', nullable: true })
  billingPeriodEnd: Date;

  // Notes
  @Column({ type: 'text', nullable: true })
  notes: string;

  // Metadata
  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  // Timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
