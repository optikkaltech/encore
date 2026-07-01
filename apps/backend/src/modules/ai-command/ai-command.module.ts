import { Module } from '@nestjs/common';
import { AiCommandController } from './ai-command.controller';
import { AiCommandService } from './ai-command.service';
import { PlansModule } from '../plans/plans.module';
import { SubscribersModule } from '../subscribers/subscribers.module';
import { BillingModule } from '../billing/billing.module';
import { TenancyModule } from '../../core/tenancy/tenancy.module';
import { AuditModule } from '../../core/audit/audit.module';

@Module({
  imports: [
    PlansModule,
    SubscribersModule,
    BillingModule,
    TenancyModule,
    AuditModule,
  ],
  controllers: [AiCommandController],
  providers: [AiCommandService],
})
export class AiCommandModule {}
