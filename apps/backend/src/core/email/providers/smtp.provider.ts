import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { IEmailProvider, SendEmailOptions } from '../email.interfaces';
import { EmailConfig } from '../../../config/email.config';

/**
 * SMTP Provider - Generic SMTP email delivery
 */
export class SmtpProvider implements IEmailProvider {
  private readonly logger = new Logger(SmtpProvider.name);
  private transporter: Transporter;

  constructor(private config: EmailConfig) {
    this.transporter = nodemailer.createTransport({
      host: this.config.smtpHost,
      port: this.config.smtpPort,
      secure: this.config.smtpSecure,
      auth: {
        user: this.config.smtpUser,
        pass: this.config.smtpPass,
      },
    });
  }

  async send(options: SendEmailOptions): Promise<void> {
    if (!this.config.smtpHost) {
      throw new Error('SMTP host not configured');
    }

    const info = await this.transporter.sendMail({
      from: `"${this.config.from.name}" <${this.config.from.email}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments?.map((att) => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType,
      })),
    });

    this.logger.log(`Email sent via SMTP to ${options.to}: ${info.messageId}`);
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.config.smtpHost) {
      this.logger.warn('SMTP host not configured');
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      this.logger.error('SMTP connection failed', error);
      return false;
    }
  }
}
