import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { createHash, timingSafeEqual } from 'crypto';

/**
 * CsrfGuard - CSRF protection for state-changing operations.
 *
 * Validates CSRF token on mutations (POST, PUT, DELETE, PATCH).
 * Stateless implementation using double-submit cookie pattern.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly safeMethods = ['GET', 'HEAD', 'OPTIONS', 'TRACE'];
  private readonly tokenHeader = 'x-csrf-token';
  private readonly cookieName = 'csrf_token';

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;

    // Safe methods don't need CSRF protection
    if (this.safeMethods.includes(method)) {
      return true;
    }

    // Skip for API key authentication (stateless APIs)
    if (request.headers['x-api-key']) {
      return true;
    }

    // Skip if no session (not authenticated)
    if (!request.user) {
      return true;
    }

    const csrfToken = request.headers[this.tokenHeader] as string;
    const cookieToken = request.cookies?.[this.cookieName];

    if (!csrfToken || !cookieToken) {
      throw new ForbiddenException('CSRF token missing');
    }

    // Timing-safe comparison to prevent timing attacks
    if (!this.timingSafeCompare(csrfToken, cookieToken)) {
      throw new ForbiddenException('CSRF token invalid');
    }

    return true;
  }

  private timingSafeCompare(a: string, b: string): boolean {
    try {
      const bufA = Buffer.from(a);
      const bufB = Buffer.from(b);

      if (bufA.length !== bufB.length) {
        return false;
      }

      return timingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  }

  /**
   * Generate a new CSRF token for the session.
   */
  generateToken(sessionId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const data = `${sessionId}:${timestamp}:${random}`;
    return createHash('sha256').update(data).digest('hex');
  }
}
