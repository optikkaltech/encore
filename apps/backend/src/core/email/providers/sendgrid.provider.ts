import { Logger } from '@nestjs/common';
import sgMail from '@sendgrid/mail';
import { IEmailProvider, SendEmailOptions } from '../email.interfaces';
import { EmailConfig } from '../../../config/email.config';

/**
 * SendGrid Provider - Production email delivery
 */
export class SendGridProvider implements IEmailProvider {
  private readonly logger = new Logger(SendGridProvider.name);

  constructor(private config: EmailConfig) {
    if (this.config.sendgridApiKey) {
      sgMail.setApiKey(this.config.sendgridApiKey);
    }
  }

  async send(options: SendEmailOptions): Promise<void> {
    if (!this.config.sendgridApiKey) {
      throw new Error('SendGrid API key not configured');
    }

    const useTemplateId =
      options.templateId && options.templateId !== 'd-xxxxx'
        ? options.templateId
        : undefined;

    const msg = {
      to: options.to,
      from: {
        email: this.config.from.email,
        name: this.config.from.name,
      },
      subject: options.subject,
      text: options.text,
      html: options.html,
      ...(useTemplateId
        ? {
            templateId: useTemplateId,
            dynamicTemplateData: options.templateData,
          }
        : {}),
      attachments: options.attachments?.map((att) => ({
        filename: att.filename,
        content: att.content.toString('base64'),
        type: att.contentType,
        disposition: 'attachment',
      })),
    };

    await sgMail.send(msg as any);
    this.logger.log(`Email sent via SendGrid to ${options.to}`);
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.config.sendgridApiKey) {
      this.logger.warn('SendGrid API key not configured');
      return false;
    }

    try {
      // SendGrid doesn't have a direct verify endpoint
      // We just check if API key is set
      return true;
    } catch {
      return false;
    }
  }
}
