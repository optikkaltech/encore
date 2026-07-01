import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

/**
 * TenantThrottlerGuard - Rate limiting per tenant (merchant).
 *
 * Extends NestJS Throttler to track limits by tenant ID instead of just IP.
 * This prevents one merchant from consuming all rate limit budget.
 *
 * Key features:
 * - Tracks by tenant ID + endpoint
 * - Falls back to IP for unauthenticated requests
 * - Different limits for different user roles
 */
@Injectable()
export class TenantThrottlerGuard extends ThrottlerGuard {
  /**
   * Override to generate tracking key based on tenant.
   */
  protected async getTracker(req: Request): Promise<string> {
    // Use tenant ID if available, otherwise fall back to IP
    const tenantId = (req as any).user?.merchantId;

    if (tenantId) {
      // Track per tenant per endpoint
      return `tenant:${tenantId}:${req.path}`;
    }

    // For unauthenticated requests, track by IP
    return `ip:${req.ip}:${req.path}`;
  }

  /**
   * Override to apply different limits based on user role.
   */
  protected async getThrottlerOptions(
    context: ExecutionContext,
  ): Promise<{ limit: number; ttl: number }> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;

    // Super admin gets higher limits
    if (user?.role === 'super_admin') {
      return { limit: 10000, ttl: 60 }; // 10k requests per minute
    }

    // Regular admin/manager
    if (user?.role === 'admin') {
      return { limit: 1000, ttl: 60 }; // 1k requests per minute
    }

    // API key users
    if (user?.role === 'api_key') {
      return { limit: 500, ttl: 60 }; // 500 requests per minute
    }

    // Default (unauthenticated or regular users)
    return { limit: 100, ttl: 60 }; // 100 requests per minute
  }

  /**
   * Custom error message with tenant context.
   */
  protected async throwThrottlingException(): Promise<void> {
    throw new Error('Rate limit exceeded. Please try again later.');
  }
}
