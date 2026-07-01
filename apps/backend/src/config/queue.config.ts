import { registerAs } from '@nestjs/config';
import { BullRootModuleOptions } from '@nestjs/bull';

export default registerAs('queue', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '', 10) || 6379,
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '', 10) || 0,

  // Connection settings for high throughput
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
}));
