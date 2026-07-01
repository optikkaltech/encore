import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * SQLInjectionGuard - Blocks requests with SQL injection attempts.
 *
 * Defense in depth: Even with parameterized queries, this provides
 * an additional layer at the HTTP layer.
 */
@Injectable()
export class SQLInjectionGuard implements CanActivate {
  private readonly sqlKeywords = [
    'SELECT',
    'INSERT',
    'UPDATE',
    'DELETE',
    'DROP',
    'CREATE',
    'ALTER',
    'TRUNCATE',
    'UNION',
    'EXEC',
    'EXECUTE',
    'SCRIPT',
    'FROM',
    'WHERE',
    'JOIN',
    'TABLE',
    'DATABASE',
    'SCHEMA',
  ];

  private readonly sqlOperators = [
    '--',
    '/*',
    '*/',
    ';',
    '||',
    '&&',
    '==',
    '!=',
    '<>',
    '>=',
    '<=',
  ];

  private readonly dangerousPatterns = [
    /(\d+)\s*=\s*\1/, // 1=1, 0=0 patterns
    /\bOR\s+\d+\s*=\s*\d+/i, // OR 1=1
    /\bAND\s+\d+\s*=\s*\d+/i, // AND 1=1
    /';\s*--/i, // Comment injection
    /';\s*\/\*/i, // Multi-line comment injection
    /\bUNION\s+SELECT\b/i, // Union select
    /\bSLEEP\s*\(/i, // Time-based SQLi
    /\bBENCHMARK\s*\(/i, // Benchmark injection
    /\bpg_sleep\s*\(/i, // PostgreSQL sleep
    /\bWAITFOR\s+DELAY\b/i, // MSSQL delay
  ];

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Check query parameters
    if (request.query && Object.keys(request.query).length > 0) {
      this.validateObject(request.query, 'query');
    }

    // Check URL parameters
    if (request.params && Object.keys(request.params).length > 0) {
      this.validateObject(request.params, 'params');
    }

    // Check headers (less common but possible)
    const sensitiveHeaders = ['x-custom-filter', 'x-sort', 'x-order'];
    for (const header of sensitiveHeaders) {
      if (request.headers[header]) {
        this.validateString(
          String(request.headers[header]),
          `header:${header}`,
        );
      }
    }

    return true;
  }

  private validateObject(obj: Record<string, unknown>, location: string): void {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        this.validateString(value, `${location}.${key}`);
      } else if (typeof value === 'object' && value !== null) {
        this.validateObject(
          value as Record<string, unknown>,
          `${location}.${key}`,
        );
      }
    }
  }

  private validateString(value: string, field: string): void {
    const upperValue = value.toUpperCase();

    // Check for dangerous patterns first
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(value)) {
        throw new BadRequestException(
          `Suspicious pattern detected in ${field}`,
        );
      }
    }

    // Check SQL keywords with context
    for (const keyword of this.sqlKeywords) {
      // Look for keyword followed by space and more content
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(value)) {
        // Check if it's part of a larger SQL pattern
        const hasMultipleKeywords =
          this.sqlKeywords.filter((k) =>
            new RegExp(`\\b${k}\\b`, 'i').test(value),
          ).length >= 2;

        if (
          hasMultipleKeywords ||
          this.sqlOperators.some((op) => value.includes(op))
        ) {
          throw new BadRequestException(`SQL keyword detected in ${field}`);
        }
      }
    }
  }
}
