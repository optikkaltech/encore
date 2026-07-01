import { registerAs } from '@nestjs/config';

export default registerAs('nomba', () => ({
  baseUrl: process.env.NOMBA_BASE_URL || 'https://api.nomba.com/v1',
  clientId: process.env.NOMBA_CLIENT_ID,
  clientSecret: process.env.NOMBA_CLIENT_SECRET,
  accountId: process.env.NOMBA_ACCOUNT_ID,

  // Webhook security
  webhookSecret: process.env.NOMBA_WEBHOOK_SECRET,

  // Rate limiting - Nomba API limits
  maxRequestsPerSecond: parseInt(process.env.NOMBA_RATE_LIMIT || '', 10) || 10,

  // Retry configuration
  maxRetries: parseInt(process.env.NOMBA_MAX_RETRIES || '', 10) || 3,
  retryDelay: parseInt(process.env.NOMBA_RETRY_DELAY || '', 10) || 1000,
}));
