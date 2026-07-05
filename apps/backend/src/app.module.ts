import {
  Module,
  NestModule,
  MiddlewareConsumer,
  ValidationPipe,
  Scope,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';

// Config
import databaseConfig from './config/database.config';
import appConfig from './config/app.config';
import nombaConfig from './config/nomba.config';
import queueConfig from './config/queue.config';
import storageConfig from './config/storage.config';
import pricingConfig from './config/pricing.config';
import emailConfig from './config/email.config';

// Core Security & Audit
import { TenancyModule } from './core/tenancy';
import { AuditModule, AuditInterceptor } from './core/audit';
import { SecurityModule, TenantThrottlerGuard } from './core/security';
import { AuthModule, JwtAuthGuard } from './core/auth';

// Security Infrastructure
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { SanitizePipe } from './common/pipes/sanitize.pipe';

// Domain Modules
import { MerchantsModule } from './modules/merchants';
import { SubscribersModule } from './modules/subscribers/subscribers.module';
import { PlansModule } from './modules/plans/plans.module';
import { BillingModule } from './modules/billing/billing.module';
import { DunningModule } from './modules/dunning';
// import { NombaModule } from './modules/nomba';
import { UploadsModule } from './modules/uploads/uploads.module';
import { SystemConfigModule } from './modules/system-config/system-config.module';
import { NombaModule } from './core/nomba/nomba.module';
import { AiCommandModule } from './modules/ai-command/ai-command.module';
import { PayoutsModule } from './modules/payouts/payouts.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        appConfig,
        nombaConfig,
        queueConfig,
        storageConfig,
        pricingConfig,
        emailConfig,
      ],
      envFilePath: ['.env', '.env.local'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbConfig = config.get('database');
        if (!dbConfig) {
          throw new Error('Database configuration not found');
        }
        return dbConfig;
      },
    }),

    // Queue (Redis) - for billing scheduler scalability
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: config.get('queue'),
      }),
    }),

    // Core Infrastructure
    TenancyModule,
    AuditModule,
    SecurityModule,
    AuthModule,
    UploadsModule,
    SystemConfigModule,
    NombaModule,
    AiCommandModule,

    // Domain Modules (enable as implemented)
    MerchantsModule,
    SubscribersModule,
    PlansModule,
    BillingModule,
    DunningModule,
    PayoutsModule,
    // NombaModule,
  ],

  providers: [
    // Global Security: JWT Authentication
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

    // Global Security: Rate limiting per tenant
    {
      provide: APP_GUARD,
      useClass: TenantThrottlerGuard,
    },

    // Global Security: Exception filtering with PII redaction
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },

    // Global Security: Input sanitization
    {
      provide: APP_PIPE,
      useClass: SanitizePipe,
    },

    // Global Security: Validation
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          forbidUnknownValues: true,
          transform: true,
          transformOptions: { enableImplicitConversion: false },
        }),
    },

    // Global Audit: Activity logging
    {
      provide: APP_INTERCEPTOR,
      scope: Scope.REQUEST,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Apply security middleware to all routes
    consumer
      .apply(RequestIdMiddleware, SecurityHeadersMiddleware)
      .forRoutes('*');
  }
}
