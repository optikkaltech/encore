import { Logger } from '@nestjs/common';
import { IEmailProvider, SendEmailOptions } from '../email.interfaces';
import { EmailConfig } from '../../../config/email.config';

/**
 * MailerSend Provider - Production email delivery via HTTP API
 */
export class MailerSendProvider implements IEmailProvider {
  private readonly logger = new Logger(MailerSendProvider.name);

  constructor(private config: EmailConfig) { }

  async send(options: SendEmailOptions): Promise<void> {
    const mailerKey = this.config.mailersendApiKey;
    if (!mailerKey) {
      throw new Error('MailerSend API key not configured');
    }

    const fromName = this.config.from.name
    const fromAddress = this.config.from.email || 'info@cliquohq.com';
    const defaultReplyTo = fromAddress;

    // Handle single or multiple recipients
    const toEmail = Array.isArray(options.to) ? options.to[0] : options.to;

    const response = await fetch('https://api.mailersend.com/v1/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'Authorization': `Bearer ${mailerKey}`,
      },
      body: JSON.stringify({
        from: {
          email: fromAddress,
          name: fromName,
        },
        to: [
          {
            email: toEmail,
          },
        ],
        reply_to: {
          email: defaultReplyTo,
          name: fromName,
        },
        subject: options.subject,
        html: options.html || options.text,
        text: options.subject, // Simple fallback for text
        attachments: options.attachments?.map((a) => ({
          content: a.content.toString('base64'),
          filename: a.filename,
        })),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json() as any;
      throw new Error(errorData.message || 'MailerSend API error');
    }

    this.logger.log(`Email sent via MailerSend to ${toEmail}`);
  }

  async verifyConnection(): Promise<boolean> {
    const apiKey = this.config.mailersendApiKey;
    return !!apiKey;
  }
}
