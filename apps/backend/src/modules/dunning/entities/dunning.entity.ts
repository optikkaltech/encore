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
import { DunningStatus } from '../../../shared/enums';
import { Merchant } from '../../merchants/entities';
import { Subscriber } from '../../subscribers/entities/subscriber.entity';
import { Subscription } from '../../subscribers/entities/subscription.entity';
import { Invoice } from '../../billing/entities/invoice.entity';

@Entity('dunning_logs')
@Index(['merchantId', 'status'])
@Index(['merchantId', 'subscriberId'])
export class Dunning {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  merchantId: string;

  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant;

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

  @Column({ type: 'uuid' })
  invoiceId: string;

  @ManyToOne(() => Invoice, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoiceId' })
  invoice: Invoice;

  @Column({ type: 'decimal', precision: 19, scale: 4 })
  amount: number;

  @Column({
    type: 'enum',
    enum: DunningStatus,
    default: DunningStatus.IN_PROGRESS,
  })
  status: DunningStatus;

  @Column({ type: 'integer', default: 0 })
  attemptCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastAttemptAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextAttemptAt: Date;

  @Column({ type: 'jsonb', default: [] })
  timeline: Array<{
    timestamp: string;
    action: string;
    description: string;
    attempt?: number;
  }>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
