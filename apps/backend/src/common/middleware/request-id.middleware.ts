import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';

/**
 * RequestIdMiddleware - Adds unique request ID to all requests.
 *
 * Benefits:
 * - Distributed tracing across services
 * - Forensic analysis of security incidents
 * - Debugging and log correlation
 * - Rate limiting per request
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Accept external request ID (from API gateway/load balancer)
    // or generate a new one
    const requestId =
      (req.headers['x-request-id'] as string) ||
      (req.headers['x-correlation-id'] as string) ||
      this.generateRequestId();

    // Set on request for access in controllers/services
    req['requestId'] = requestId;

    // Set on response headers for client correlation
    res.setHeader('x-request-id', requestId);

    // Set start time for request duration tracking
    req['startTime'] = Date.now();

    // Log request start (with PII redaction)
    this.logRequestStart(req, requestId);

    // Log response when finished
    res.on('finish', () => {
      this.logRequestEnd(req, res, requestId);
    });

    next();
  }

  private generateRequestId(): string {
    // Format: timestamp-random (20 chars total)
    const timestamp = Date.now().toString(36);
    const random = randomBytes(6).toString('hex');
    return `${timestamp}-${random}`;
  }

  private logRequestStart(req: Request, requestId: string): void {
    // Redact sensitive query params
    const url = this.redactUrl(req.url);

    console.log({
      type: 'request_start',
      requestId,
      method: req.method,
      path: url,
      ip: this.maskIp(req.ip),
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString(),
    });
  }

  private logRequestEnd(req: Request, res: Response, requestId: string): void {
    const duration = Date.now() - (req['startTime'] || Date.now());

    console.log({
      type: 'request_end',
      requestId,
      method: req.method,
      path: this.redactUrl(req.url),
      statusCode: res.statusCode,
      duration,
      timestamp: new Date().toISOString(),
    });
  }

  private redactUrl(url: string): string {
    // Remove query parameters that might contain PII
    const sensitiveParams = [
      'token',
      'password',
      'api_key',
      'secret',
      'code',
      'email',
    ];

    try {
      const parsed = new URL(url, 'http://localhost');

      for (const param of sensitiveParams) {
        if (parsed.searchParams.has(param)) {
          parsed.searchParams.set(param, '[REDACTED]');
        }
      }

      return parsed.pathname + parsed.search;
    } catch {
      return url;
    }
  }

  private maskIp(ip: string | undefined): string {
    if (!ip) return 'unknown';

    // IPv4: mask last octet
    if (ip.includes('.')) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.***`;
      }
    }

    // IPv6: mask last segment
    if (ip.includes(':')) {
      const parts = ip.split(':');
      if (parts.length > 2) {
        return `${parts.slice(0, -2).join(':')}:****:****`;
      }
    }

    return ip;
  }
}
