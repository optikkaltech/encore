import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DunningController } from './dunning.controller';
import { DunningService } from './dunning.service';
import { Dunning } from './entities/dunning.entity';
import { Subscriber } from '../subscribers/entities/subscriber.entity';
import { Subscription } from '../subscribers/entities/subscription.entity';
import { Invoice } from '../billing/entities/invoice.entity';
import { NombaModule } from '../../core/nomba/nomba.module';
import { EmailModule } from '../../core/email/email.module';
import { BillingModule } from '../billing/billing.module';
import { SubscribersModule } from '../subscribers/subscribers.module';
import { TenancyModule } from '../../core/tenancy/tenancy.module';
import { AuditModule } from '../../core/audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Dunning, Subscriber, Subscription, Invoice]),
    NombaModule,
    EmailModule,
    TenancyModule,
    AuditModule,
    forwardRef(() => BillingModule),
    forwardRef(() => SubscribersModule),
  ],
  controllers: [DunningController],
  providers: [DunningService],
  exports: [DunningService],
})
export class DunningModule {}
