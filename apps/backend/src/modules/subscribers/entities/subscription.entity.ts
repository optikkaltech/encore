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
import { SubscriptionStatus } from '../../../shared/enums';
import { Merchant } from '../../merchants/entities';
import { Plan } from '../../plans/entities';
import { Subscriber } from './subscriber.entity';

/**
 * Subscription entity - links a subscriber to a plan.
 * A subscriber can have multiple subscriptions (historical + current).
 */
@Entity('subscriptions')
@Index(['merchantId', 'subscriberId'])
@Index(['merchantId', 'status'])
@Index(['merchantId', 'planId'])
export class Subscription {
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
  planId: string;

  @ManyToOne(() => Plan, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'planId' })
  plan: Plan;

  // Subscription status
  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  // Billing amounts (snapshot from plan at time of subscription)
  @Column({ type: 'decimal', precision: 19, scale: 4 })
  planAmount: number;

  @Column({ type: 'decimal', precision: 19, scale: 4, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 19, scale: 4 })
  finalAmount: number; // planAmount - discountAmount

  // Billing dates
  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date; // For fixed-term subscriptions

  @Column({ type: 'timestamp' })
  currentPeriodStart: Date;

  @Column({ type: 'timestamp' })
  currentPeriodEnd: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cancellationReason: string;

  // Pause configuration
  @Column({ type: 'timestamp', nullable: true })
  pausedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  pauseResumesAt: Date;

  // Usage tracking (for usage-based billing)
  @Column({ type: 'decimal', precision: 19, scale: 4, default: 0 })
  currentUsage: number;

  @Column({ type: 'jsonb', default: {} })
  usageDetails: Record<string, unknown>;

  // Metadata
  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  // Timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
