import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * AuditLog entity - immutable record of all user/admin actions.
 * Required for PCI-DSS compliance and security forensics.
 *
 * Design decisions:
 * - Separate table with minimal indexes for fast writes
 * - JSONB for flexible data without schema changes
 * - No foreign keys for performance (denormalized merchantId)
 * - Partitioned by date for scalability
 */
@Entity('audit_logs')
@Index(['merchantId', 'createdAt'])
@Index(['merchantId', 'userId', 'createdAt'])
@Index(['merchantId', 'action', 'createdAt'])
@Index(['ipAddress', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Multi-tenancy
  @Column({ type: 'uuid', nullable: true })
  merchantId: string | null;

  // Actor identification
  @Column({ type: 'uuid', nullable: true })
  userId: string; // Can be null for system actions

  @Column({ type: 'varchar', length: 255, nullable: true })
  userEmail: string; // Denormalized for audit trail

  @Column({ type: 'varchar', length: 50 })
  userRole: 'admin' | 'user' | 'system' | 'api_key';

  // Action details
  @Column({ type: 'varchar', length: 100 })
  action: string; // e.g., 'subscriber.create', 'payment.retry', 'plan.update'

  @Column({ type: 'varchar', length: 50 })
  entityType: string; // e.g., 'subscriber', 'transaction', 'plan'

  @Column({ type: 'uuid', nullable: true })
  entityId: string;

  // Request context
  @Column({ type: 'varchar', length: 45 })
  ipAddress: string;

  @Column({ type: 'varchar', length: 500 })
  userAgent: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  httpMethod: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  endpoint: string;

  // Data snapshots (for reconstructing what happened)
  @Column({ type: 'jsonb', nullable: true })
  beforeState: Record<string, unknown>; // Previous values

  @Column({ type: 'jsonb', nullable: true })
  afterState: Record<string, unknown>; // New values

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>; // Additional context

  // Security classification
  @Column({ type: 'varchar', length: 20, default: 'normal' })
  severity: 'normal' | 'warning' | 'critical';

  @Column({ type: 'boolean', default: false })
  isSensitive: boolean; // PII/sensitive operation

  // Result
  @Column({ type: 'varchar', length: 20, default: 'success' })
  result: 'success' | 'failure' | 'denied';

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  // Integrity: hash chain for tamper detection (future enhancement)
  @Column({ type: 'varchar', length: 64, nullable: true })
  integrityHash: string;

  // Partition key for database partitioning
  @Column({ type: 'date' })
  partitionDate: Date;

  @CreateDateColumn()
  createdAt: Date;
}
