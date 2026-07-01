import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

/**
 * ErrorResponse - Sanitized error response structure.
 */
interface ErrorResponse {
  statusCode: number;
  code: string;
  message: string;
  requestId: string;
  timestamp: string;
  path: string;
  // NEVER include: stack trace, SQL, internal details
}

/**
 * GlobalExceptionFilter - Production-grade error handling.
 *
 * Security features:
 * - PII redaction from all error messages
 * - Database error sanitization (no schema leakage)
 * - Consistent error format (no info leakage via variance)
 * - Request ID correlation for forensics
 * - Log levels based on severity
 */
@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  // PII patterns to redact
  private readonly piiPatterns = [
    {
      regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      replacement: '[EMAIL_REDACTED]',
    },
    { regex: /\b\d{16}\b/g, replacement: '[CARD_REDACTED]' },
    {
      regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
      replacement: '[CARD_REDACTED]',
    },
    { regex: /\b\d{10,11}\b/g, replacement: '[PHONE_REDACTED]' },
    {
      regex: /\b[A-Z]{2}\d{2}[\s]?[A-Z0-9]{4}[\s]?\d{4}[\s]?\d{4}\b/gi,
      replacement: '[IBAN_REDACTED]',
    },
    {
      regex: /password[\"']?\s*[:=]\s*[\"']?[^\"'\s]+/gi,
      replacement: 'password=[REDACTED]',
    },
    {
      regex: /token[\"']?\s*[:=]\s*[\"']?[^\"'\s]+/gi,
      replacement: 'token=[REDACTED]',
    },
    {
      regex: /api[_-]?key[\"']?\s*[:=]\s*[\"']?[^\"'\s]+/gi,
      replacement: 'api_key=[REDACTED]',
    },
    {
      regex: /secret[\"']?\s*[:=]\s*[\"']?[^\"'\s]+/gi,
      replacement: 'secret=[REDACTED]',
    },
    {
      regex: /authorization[\s]*[:=][\s]*bearer[\s]+\S+/gi,
      replacement: 'authorization=[REDACTED]',
    },
  ];

  // Database errors that should never be exposed
  private readonly dbErrorKeywords = [
    'column',
    'table',
    'schema',
    'database',
    'constraint',
    'foreign key',
    'syntax',
    'sql',
    'postgresql',
    'mysql',
    'sqlite',
    'oracle',
    'relation',
    'sequence',
    'trigger',
    'function',
    'procedure',
  ];

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId =
      (request.headers['x-request-id'] as string) || this.generateRequestId();

    // Determine error characteristics
    const { status, code, message, severity } = this.parseError(exception);

    // Build sanitized response
    const errorResponse: ErrorResponse = {
      statusCode: status,
      code,
      message: this.sanitizeForClient(message),
      requestId,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Log with appropriate level and detail
    this.logError(exception, request, errorResponse, severity);

    // Send response
    response.status(status).json(errorResponse);
  }

  private parseError(exception: unknown): {
    status: number;
    code: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  } {
    // HTTP exceptions (expected client errors)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const message =
        typeof response === 'string'
          ? response
          : (response as any).message || 'Request failed';

      return {
        status,
        code: `HTTP_${status}`,
        message: Array.isArray(message) ? message.join(', ') : message,
        severity: status >= 500 ? 'high' : 'low',
      };
    }

    // JWT errors - authentication failures
    if (exception instanceof TokenExpiredError) {
      return {
        status: HttpStatus.UNAUTHORIZED,
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired',
        severity: 'medium',
      };
    }

    if (exception instanceof JsonWebTokenError) {
      return {
        status: HttpStatus.UNAUTHORIZED,
        code: 'TOKEN_INVALID',
        message: 'Authentication token is invalid',
        severity: 'medium',
      };
    }

    // Database errors - SANITIZE COMPLETELY
    if (exception instanceof QueryFailedError) {
      // Log full error internally
      this.logger.error(`Database error: ${exception.message}`);

      return {
        status: HttpStatus.BAD_REQUEST,
        code: 'DATABASE_ERROR',
        message: 'Database operation failed',
        severity: 'high',
      };
    }

    if (exception instanceof EntityNotFoundError) {
      return {
        status: HttpStatus.NOT_FOUND,
        code: 'ENTITY_NOT_FOUND',
        message: 'Requested resource not found',
        severity: 'low',
      };
    }

    // Syntax errors (malformed JSON, etc.)
    if (exception instanceof SyntaxError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        code: 'SYNTAX_ERROR',
        message: 'Invalid request format',
        severity: 'low',
      };
    }

    // Validation errors
    if (exception instanceof Error && exception.name === 'ValidationError') {
      return {
        status: HttpStatus.BAD_REQUEST,
        code: 'VALIDATION_ERROR',
        message: exception.message || 'Validation failed',
        severity: 'low',
      };
    }

    // Unknown/unexpected errors - hide details completely
    const isError = exception instanceof Error;
    if (isError) {
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      severity: 'critical',
    };
  }

  private sanitizeForClient(message: string): string {
    let sanitized = message;

    // Remove PII
    for (const pattern of this.piiPatterns) {
      sanitized = sanitized.replace(pattern.regex, pattern.replacement);
    }

    // Remove database keywords
    for (const keyword of this.dbErrorKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      sanitized = sanitized.replace(regex, '[REDACTED]');
    }

    // Remove file paths
    sanitized = sanitized.replace(
      /[\/](?:[\w-]+[\/])+[\w-]+/g,
      '[PATH_REDACTED]',
    );

    // Remove stack trace indicators
    sanitized = sanitized.replace(/at\s+\S+/g, '');
    sanitized = sanitized.replace(/\n\s*/g, ' ');

    return sanitized.trim();
  }

  private logError(
    exception: unknown,
    request: Request,
    errorResponse: ErrorResponse,
    severity: string,
  ): void {
    const logData = {
      requestId: errorResponse.requestId,
      code: errorResponse.code,
      statusCode: errorResponse.statusCode,
      path: request.url,
      method: request.method,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      severity,
      // Include original error for high/critical severity
      ...(severity === 'high' || severity === 'critical'
        ? {
            originalError:
              exception instanceof Error ? exception.message : 'Unknown error',
            stack: exception instanceof Error ? exception.stack : undefined,
          }
        : {}),
    };

    switch (severity) {
      case 'critical':
        this.logger.error(logData);
        // TODO: Alert on-call for critical errors
        break;
      case 'high':
        this.logger.error(logData);
        break;
      case 'medium':
        this.logger.warn(logData);
        break;
      default:
        this.logger.log(logData);
    }
  }

  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
