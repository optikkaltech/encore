import { SetMetadata, applyDecorators, UseGuards } from '@nestjs/common';
import { SQLInjectionGuard } from '../guards/sql-injection.guard';
import { SanitizePipe } from '../pipes/sanitize.pipe';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * @Public() - Mark endpoint as publicly accessible (no auth required).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * @Secure() - Apply all security guards to endpoint.
 * Use for all sensitive operations.
 */
export const Secure = () =>
  applyDecorators(UseGuards(SQLInjectionGuard), SetMetadata('sanitize', true));

/**
 * @AdminOnly() - Restrict to admin users only.
 */
export const AdminOnly = () => SetMetadata('roles', ['admin', 'super_admin']);

/**
 * @SuperAdminOnly() - Restrict to super admin only.
 */
export const SuperAdminOnly = () => SetMetadata('roles', ['super_admin']);

/**
 * @Sensitive() - Mark operation as handling sensitive data.
 * Triggers enhanced audit logging.
 */
export const Sensitive = () => SetMetadata('isSensitive', true);
