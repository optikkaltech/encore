import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { SubscribersController } from './subscribers.controller';
import { SubscribersService } from './subscribers.service';
import { Subscriber } from './entities/subscriber.entity';
import { Subscription } from './entities/subscription.entity';
import { PlansModule } from '../plans/plans.module';
import { TenancyModule } from '../../core/tenancy/tenancy.module';
import { AuditModule } from '../../core/audit/audit.module';
import { NombaModule } from '../../core/nomba/nomba.module';
import { BillingModule } from '../billing/billing.module';
import { EmailModule } from '../../core/email/email.module';

// Portal-specific imports
import { PortalAuthService } from './portal-auth.service';
import { PortalAuthController } from './portal-auth.controller';
import { PortalDataController } from './portal-data.controller';
import { PortalConfigController } from './portal-config.controller';
import { PortalPdfService } from './portal-pdf.service';
import { PortalJwtStrategy } from './strategies/portal-jwt.strategy';
import { PortalGuard } from './guards/portal.guard';
import { Invoice } from '../billing/entities/invoice.entity';
import { Transaction } from '../billing/entities/transaction.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { Plan } from '../plans/entities/plan.entity';

// Checkout & Setup imports
import { CheckoutController } from './checkout.controller';
import { SetupController } from './setup.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subscriber,
      Subscription,
      Invoice,
      Transaction,
      Merchant,
      Plan,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    PlansModule,
    TenancyModule,
    AuditModule,
    forwardRef(() => NombaModule),
    forwardRef(() => BillingModule),
    forwardRef(() => EmailModule),
  ],
  controllers: [
    SubscribersController,
    PortalAuthController,
    PortalDataController,
    PortalConfigController,
    CheckoutController,
    SetupController,
  ],
  providers: [
    SubscribersService,
    PortalAuthService,
    PortalPdfService,
    PortalJwtStrategy,
    PortalGuard,
  ],
  exports: [SubscribersService, PortalAuthService, PortalPdfService],
})
export class SubscribersModule {}
