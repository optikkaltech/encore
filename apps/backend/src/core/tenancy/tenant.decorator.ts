import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Get the current merchant ID from the tenant context.
 * This enforces multi-tenancy - all queries must be scoped to this merchant.
 */
export const CurrentMerchant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request['user'] as any;

    const merchantId = user?.merchantId || user?.sub;
    if (!merchantId) {
      throw new Error('Merchant ID not found - ensure TenantGuard is applied');
    }

    return merchantId;
  },
);

/**
 * Get the full user payload from the JWT token.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request['user'] as JwtPayload | undefined;

    if (!user) {
      throw new Error('User not found - ensure TenantGuard is applied');
    }

    return data && user ? user[data] : user;
  },
);

interface JwtPayload {
  sub: string;
  merchantId: string;
  email: string;
  role: string;
}
