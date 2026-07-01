import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

/**
 * SecurityExceptionFilter - Handles security-related errors.
 *
 * Prevents information leakage:
 * - Database errors don't expose schema details
 * - SQL errors are sanitized
 * - Stack traces hidden in production
 */
@Catch()
export class SecurityExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SecurityExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    // Handle known exception types
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      message =
        typeof response === 'string'
          ? response
          : (response as any).message || exception.message;
      code = `HTTP_${status}`;
    } else if (exception instanceof QueryFailedError) {
      // Database errors - sanitize to prevent schema exposure
      status = HttpStatus.BAD_REQUEST;
      message = 'Database operation failed';
      code = 'DB_ERROR';

      // Log full error internally but don't expose
      this.logger.error(
        `Database error: ${exception.message}`,
        exception.stack,
      );
    } else if (exception instanceof Error) {
      // Generic errors
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
    }

    // Log security-relevant errors
    if (status >= 400) {
      this.logger.warn({
        message: 'Security-relevant error',
        status,
        code,
        path: request.path,
        method: request.method,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      });
    }

    // Send sanitized response
    response.status(status).json({
      statusCode: status,
      code,
      message: this.sanitizeMessage(message),
      timestamp: new Date().toISOString(),
      path: request.url,
      // Never include stack trace or internal details
    });
  }

  private sanitizeMessage(message: string): string {
    // Remove potential sensitive data from error messages
    return message
      .replace(/password[=:]\s*\S+/gi, 'password=[REDACTED]')
      .replace(/token[=:]\s*\S+/gi, 'token=[REDACTED]')
      .replace(/key[=:]\s*\S+/gi, 'key=[REDACTED]')
      .replace(/secret[=:]\s*\S+/gi, 'secret=[REDACTED]')
      .replace(/\b\d{16}\b/g, '[CARD_NUMBER_REDACTED]') // Redact 16-digit numbers (cards)
      .replace(/\b\d{10}\b/g, '[ID_REDACTED]'); // Redact 10-digit IDs
  }
}
