import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailConfig, EmailProvider } from '../../config/email.config';
import { IEmailProvider, SendEmailOptions } from './email.interfaces';
import { ConsoleProvider } from './providers/console.provider';
import { SendGridProvider } from './providers/sendgrid.provider';
import { MailerSendProvider } from './providers/mailersend.provider';
import { SmtpProvider } from './providers/smtp.provider';
import {
  getVerificationEmailHtml,
  getPasswordResetEmailHtml,
  getWelcomeEmailHtml,
  getPaymentReceiptEmailHtml,
  getDunningEmailHtml,
  getSubscriberOnboardingEmailHtml,
} from './email.templates';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private provider: IEmailProvider;
  private config: EmailConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get<EmailConfig>('email')!;

    // Initialize provider based on config
    switch (this.config.provider) {
      case 'mailersend':
        this.provider = new MailerSendProvider(this.config);
        break;
      case 'sendgrid':
        this.provider = new SendGridProvider(this.config);
        break;
      case 'smtp':
        this.provider = new SmtpProvider(this.config);
        break;
      case 'console':
      default:
        this.provider = new ConsoleProvider(this.config);
        break;
    }
  }

  async onModuleInit(): Promise<void> {
    try {
      const isConnected = await this.provider.verifyConnection();
      if (isConnected) {
        this.logger.log(`Email provider ${this.config.provider} connected`);
      } else {
        this.logger.warn(
          `Email provider ${this.config.provider} connection failed`,
        );
      }
    } catch (error) {
      this.logger.error('Email provider connection error', error);
    }
  }

  /**
   * Send generic email
   */
  async send(options: SendEmailOptions): Promise<void> {
    try {
      await this.provider.send(options);
      this.logger.log(`Email sent to ${options.to}`);
    } catch (error) {
      this.logger.error('Failed to send email', error);
      throw error;
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(
    to: string,
    token: string,
    businessName: string,
  ): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    const html = getVerificationEmailHtml(businessName, verificationUrl);

    await this.send({
      to,
      subject: 'Verify your Encore account',
      text: `Welcome to Encore, ${businessName}! Please verify your email address by copy pasting this link: ${verificationUrl}`,
      html,
      templateId: this.config.templates.verification,
      templateData: { verificationUrl, businessName },
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const html = getPasswordResetEmailHtml(resetUrl);

    await this.send({
      to,
      subject: 'Reset your Encore password',
      text: `You requested to reset your password. Please copy paste this link: ${resetUrl}`,
      html,
      templateId: this.config.templates.passwordReset,
      templateData: { resetUrl },
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(
    to: string,
    businessName: string,
    loginUrl: string,
  ): Promise<void> {
    const html = getWelcomeEmailHtml(businessName, loginUrl);

    await this.send({
      to,
      subject: 'Welcome to Encore - Your subscription billing is ready!',
      text: `Welcome to Encore, ${businessName}! Your account is verified and ready. Go to your dashboard: ${loginUrl}`,
      html,
      templateId: this.config.templates.welcome,
      templateData: { businessName, loginUrl },
    });
  }

  /**
   * Send payment receipt email
   */
  async sendPaymentReceiptEmail(
    to: string,
    customerName: string,
    invoiceNumber: string,
    amount: string,
    date: string,
    paymentMethod: string,
    planName: string,
    viewInvoiceUrl?: string,
  ): Promise<void> {
    const html = getPaymentReceiptEmailHtml(
      customerName,
      invoiceNumber,
      amount,
      date,
      paymentMethod,
      planName,
      viewInvoiceUrl,
    );

    await this.send({
      to,
      subject: `Payment Receipt: Invoice #${invoiceNumber}`,
      text: `Hi ${customerName}, thanks for your payment! Invoice: #${invoiceNumber}. Plan: ${planName}. Amount: ${amount}. Date: ${date}. Method: ${paymentMethod}.`,
      html,
      templateId: this.config.templates.paymentReceipt,
      templateData: {
        customerName,
        invoiceNumber,
        amount,
        date,
        paymentMethod,
        planName,
        viewInvoiceUrl,
      },
    });
  }

  /**
   * Send dunning email (payment failed reminder)
   */
  async sendDunningEmail(
    to: string,
    customerName: string,
    invoiceNumber: string,
    amount: string,
    attemptCount: number,
    nextAttemptDate: string,
    updatePaymentUrl: string,
  ): Promise<void> {
    const html = getDunningEmailHtml(
      customerName,
      invoiceNumber,
      amount,
      attemptCount,
      nextAttemptDate,
      updatePaymentUrl,
    );

    await this.send({
      to,
      subject: `Action Required: Payment Failed for Invoice #${invoiceNumber}`,
      text: `Hi ${customerName}, payment of ${amount} failed for invoice #${invoiceNumber}. Attempt: ${attemptCount}. Next Retry: ${nextAttemptDate}. Please update your payment details: ${updatePaymentUrl}`,
      html,
      templateId: this.config.templates.dunningReminder,
      templateData: {
        customerName,
        invoiceNumber,
        amount,
        attemptCount,
        nextAttemptDate,
        updatePaymentUrl,
      },
    });
  }

  /**
   * Send subscriber onboarding email (after manual add OR self-enroll)
   * Contains plan summary + one-time setup link for payment + portal access
   */
  async sendSubscriberOnboardingEmail(
    to: string,
    subscriberName: string,
    merchantName: string,
    planName: string,
    amount: string,
    frequency: string,
    setupUrl: string,
    trialDays?: number,
  ): Promise<void> {
    const html = getSubscriberOnboardingEmailHtml(
      subscriberName,
      merchantName,
      planName,
      amount,
      frequency,
      setupUrl,
      trialDays,
    );
    await this.send({
      to,
      subject: `You've been added to ${merchantName} — complete your setup`,
      text: `Hi ${subscriberName}, you've been added to ${merchantName} on the ${planName} plan (${amount} ${frequency}). Complete your setup here: ${setupUrl}`,
      html,
    });
  }
}
