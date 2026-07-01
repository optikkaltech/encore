import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'encore',
    password: process.env.DB_PASSWORD || 'encore',
    database: process.env.DB_NAME || 'encore_db',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: process.env.NODE_ENV !== 'production',
    logging: ['error'],
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    // Connection pooling for 10k concurrent jobs
    extra: {
      max: 20,
      min: 5,
      acquireTimeoutMillis: 60000,
      idleTimeoutMillis: 30000,
    },
  }),
);
