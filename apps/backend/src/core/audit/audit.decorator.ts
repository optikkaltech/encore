import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit';

interface AuditOptions {
  action: string;
  entityType: string;
  isSensitive?: boolean;
  severity?: 'normal' | 'warning' | 'critical';
  logResponse?: boolean; // Whether to include response data in audit
}

/**
 * @Audit() decorator - Mark methods for detailed audit logging.
 *
 * Usage:
 * @Audit({ action: 'subscriber.create', entityType: 'subscriber', isSensitive: true })
 * async createSubscriber(...) { ... }
 */
export const Audit = (options: AuditOptions) => SetMetadata(AUDIT_KEY, options);

/**
 * @SkipAudit() decorator - Exclude endpoint from automatic auditing.
 * Use for health checks, public endpoints, or high-volume operations.
 */
export const SkipAudit = () => SetMetadata(AUDIT_KEY, null);
