import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Request } from 'express';
import { AuditLog } from './entities/audit-log.entity';
import { TenantContextService } from '../tenancy';

interface AuditEntryOptions {
  action: string;
  entityType: string;
  entityId?: string;
  merchantId?: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  severity?: 'normal' | 'warning' | 'critical';
  isSensitive?: boolean;
  result?: 'success' | 'failure' | 'denied';
  errorMessage?: string;
}

/**
 * AuditService - Centralized audit logging for all user actions.
 *
 * Key features:
 * - Async logging (non-blocking)
 * - Automatic tenant/user context extraction
 * - Batch writes for high throughput
 * - Error resilience (logs to console if DB fails)
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private batch: DeepPartial<AuditLog>[] = [];
  private batchTimer: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
    private readonly tenantContext: TenantContextService,
  ) {
    // Flush batch every 5 seconds
    this.batchTimer = setInterval(() => this.flushBatch(), 5000);
  }

  /**
   * Log an action immediately.
   * Use for critical security events.
   */
  async log(options: AuditEntryOptions, request?: Request): Promise<void> {
    try {
      const entry = this.buildEntry(options, request);
      await this.auditRepository.save(entry);
    } catch (error) {
      // Fail-safe: log to console if DB fails
      this.logger.error(`Audit log failed: ${error.message}`, error.stack);
      this.logger.warn(`Audit entry: ${JSON.stringify(options)}`);
    }
  }

  /**
   * Add to batch for high-volume logging.
   * Use for routine operations (reads, non-sensitive actions).
   */
  logAsync(options: AuditEntryOptions, request?: Request): void {
    const entry = this.buildEntry(options, request);
    this.batch.push(entry);

    // Flush if batch is large enough
    if (this.batch.length >= 100) {
      this.flushBatch();
    }
  }

  /**
   * Log security-critical events immediately.
   */
  async logSecurity(
    action: string,
    details: {
      success: boolean;
      reason?: string;
      metadata?: Record<string, unknown>;
    },
    request?: Request,
  ): Promise<void> {
    await this.log(
      {
        action,
        entityType: 'security',
        severity: details.success ? 'warning' : 'critical',
        result: details.success ? 'success' : 'failure',
        errorMessage: details.reason,
        metadata: details.metadata,
      },
      request,
    );
  }

  /**
   * Query audit logs for a merchant.
   * Used by admin dashboard for compliance reporting.
   */
  async queryLogs(
    merchantId: string,
    options: {
      userId?: string;
      action?: string;
      startDate?: Date;
      endDate?: Date;
      severity?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<[AuditLog[], number]> {
    const qb = this.auditRepository
      .createQueryBuilder('log')
      .where('log.merchantId = :merchantId', { merchantId });

    if (options.userId) {
      qb.andWhere('log.userId = :userId', { userId: options.userId });
    }

    if (options.action) {
      qb.andWhere('log.action = :action', { action: options.action });
    }

    if (options.startDate) {
      qb.andWhere('log.createdAt >= :startDate', {
        startDate: options.startDate,
      });
    }

    if (options.endDate) {
      qb.andWhere('log.createdAt <= :endDate', { endDate: options.endDate });
    }

    if (options.severity) {
      qb.andWhere('log.severity = :severity', { severity: options.severity });
    }

    qb.orderBy('log.createdAt', 'DESC');
    qb.skip(options.offset || 0);
    qb.take(options.limit || 50);

    return qb.getManyAndCount();
  }

  private buildEntry(
    options: AuditEntryOptions,
    request?: Request,
  ): Partial<AuditLog> {
    const now = new Date();

    // Extract context from request
    const ipAddress = request?.ip || 'unknown';
    const userAgent = request?.headers['user-agent'] || 'unknown';
    const httpMethod = request?.method;
    const endpoint = request?.path;

    // Get tenant context if available
    let merchantId: string | undefined = options.merchantId;
    let userId: string | undefined;
    let userEmail: string | undefined;
    let userRole: string = 'system';

    if (!merchantId) {
      try {
        const tenant = this.tenantContext.getTenant();
        merchantId = tenant.merchantId;
      } catch {
        // No tenant context (unauthenticated or system action)
        merchantId = options.metadata?.merchantId as string;
      }
    }

    if (request?.user) {
      const u = request.user as any;
      userId = u.id || u.sub;
      userEmail = u.email;
      userRole = u.role || 'user';
    }

    return {
      merchantId: merchantId || null,
      userId,
      userEmail,
      userRole: userRole as 'admin' | 'user' | 'system' | 'api_key',
      action: options.action,
      entityType: options.entityType,
      entityId: options.entityId,
      ipAddress,
      userAgent,
      httpMethod,
      endpoint,
      beforeState: options.beforeState,
      afterState: options.afterState,
      metadata: options.metadata || {},
      severity: options.severity || 'normal',
      isSensitive: options.isSensitive || false,
      result: options.result || 'success',
      errorMessage: options.errorMessage,
      partitionDate: now,
      createdAt: now,
    };
  }

  private async flushBatch(): Promise<void> {
    if (this.batch.length === 0) return;

    const toInsert = [...this.batch];
    this.batch = [];

    try {
      await this.auditRepository.insert(toInsert as any);
    } catch (error) {
      this.logger.error(`Batch audit flush failed: ${error.message}`);
      // Keep in memory for retry? For now, log to console
      toInsert.forEach((entry) => {
        this.logger.warn(`AUDIT: ${JSON.stringify(entry)}`);
      });
    }
  }

  onModuleDestroy() {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
    // Final flush
    this.flushBatch();
  }
}
