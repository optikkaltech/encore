import { registerAs } from '@nestjs/config';

export type EmailProvider =
  | 'sendgrid'
  | 'mailersend'
  | 'aws-ses'
  | 'smtp'
  | 'console';

export interface EmailConfig {
  provider: EmailProvider;
  from: {
    email: string;
    name: string;
  };
  // SendGrid
  sendgridApiKey?: string;
  // MailerSend
  mailersendApiKey?: string;
  // AWS SES
  awsRegion?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  // SMTP
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpSecure?: boolean;
  // Templates
  templates: {
    verification: string;
    passwordReset: string;
    welcome: string;
    paymentReceipt: string;
    dunningReminder: string;
  };
}

export default registerAs(
  'email',
  (): EmailConfig => ({
    provider: (process.env.EMAIL_PROVIDER as EmailProvider) || 'console',

    from: {
      email: process.env.EMAIL_FROM || 'noreply@encore.io',
      name: process.env.EMAIL_FROM_NAME || 'Encore',
    },

    // SendGrid
    sendgridApiKey: process.env.SENDGRID_API_KEY,

    // MailerSend
    mailersendApiKey:
      process.env.MAILSENDERKEY || process.env.MAILERSEND_API_KEY,

    // AWS SES
    awsRegion: process.env.AWS_REGION || 'us-east-1',
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,

    // SMTP
    smtpHost: process.env.SMTP_HOST,
    smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    smtpSecure: process.env.SMTP_SECURE === 'true',

    // Template IDs (for SendGrid) or template names
    templates: {
      verification: process.env.TEMPLATE_VERIFICATION || 'd-xxxxx',
      passwordReset: process.env.TEMPLATE_PASSWORD_RESET || 'd-xxxxx',
      welcome: process.env.TEMPLATE_WELCOME || 'd-xxxxx',
      paymentReceipt: process.env.TEMPLATE_PAYMENT_RECEIPT || 'd-xxxxx',
      dunningReminder: process.env.TEMPLATE_DUNNING || 'd-xxxxx',
    },
  }),
);
