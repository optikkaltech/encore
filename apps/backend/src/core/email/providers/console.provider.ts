import { Logger } from '@nestjs/common';
import { IEmailProvider, SendEmailOptions } from '../email.interfaces';
import { EmailConfig } from '../../../config/email.config';

/**
 * Console Provider - Logs emails to console for development
 */
export class ConsoleProvider implements IEmailProvider {
  private readonly logger = new Logger(ConsoleProvider.name);

  constructor(private config: EmailConfig) {}

  async send(options: SendEmailOptions): Promise<void> {
    this.logger.log('========================================');
    this.logger.log('📧 EMAIL SENT (Console Provider)');
    this.logger.log('========================================');
    this.logger.log(`To: ${options.to}`);
    this.logger.log(
      `From: ${this.config.from.email} (${this.config.from.name})`,
    );
    this.logger.log(`Subject: ${options.subject}`);
    if (options.text) {
      this.logger.log(`Text: ${options.text.substring(0, 200)}...`);
    }
    if (options.html) {
      this.logger.log(`HTML: ${options.html.substring(0, 200)}...`);
    }
    this.logger.log('========================================');
  }

  async verifyConnection(): Promise<boolean> {
    this.logger.log('Console provider always connected');
    return true;
  }
}
