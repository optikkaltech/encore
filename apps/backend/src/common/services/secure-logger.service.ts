import { Injectable, Logger, LogLevel } from '@nestjs/common';
import { redactPii } from '../utils/security.utils';

/**
 * SecureLogger - PII-aware logging service.
 *
 * Automatically redacts sensitive data from all logs.
 * Compliant with NDPR and PCI-DSS logging requirements.
 */
@Injectable()
export class SecureLogger {
  private readonly logger = new Logger('SecureLogger');

  log(message: string, context?: unknown): void {
    this.logger.log(message, this.redact(context));
  }

  error(message: string, trace?: string, context?: unknown): void {
    this.logger.error(message, trace, this.redact(context));
  }

  warn(message: string, context?: unknown): void {
    this.logger.warn(message, this.redact(context));
  }

  debug(message: string, context?: unknown): void {
    this.logger.debug(message, this.redact(context));
  }

  verbose(message: string, context?: unknown): void {
    this.logger.verbose(message, this.redact(context));
  }

  /**
   * Log with explicit PII redaction context.
   */
  logSecurity(
    level: 'info' | 'warn' | 'error' | 'critical',
    event: string,
    details: Record<string, unknown>,
  ): void {
    const redactedDetails = this.redact(details) as Record<string, unknown>;

    const logEntry = {
      type: 'security_event',
      level,
      event,
      timestamp: new Date().toISOString(),
      ...redactedDetails,
    };

    switch (level) {
      case 'critical':
        this.logger.error('SECURITY_CRITICAL', JSON.stringify(logEntry));
        // TODO: Alert security team
        break;
      case 'error':
        this.logger.error('SECURITY_ERROR', JSON.stringify(logEntry));
        break;
      case 'warn':
        this.logger.warn('SECURITY_WARNING', JSON.stringify(logEntry));
        break;
      default:
        this.logger.log('SECURITY_INFO', JSON.stringify(logEntry));
    }
  }

  private redact(context: unknown): unknown {
    if (!context) return context;
    return redactPii(context);
  }
}
