export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  templateData?: Record<string, unknown>;
  attachments?: EmailAttachment[];
}

export interface IEmailProvider {
  send(options: SendEmailOptions): Promise<void>;
  verifyConnection(): Promise<boolean>;
}
