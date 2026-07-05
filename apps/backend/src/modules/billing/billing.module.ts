import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { Invoice } from './entities/invoice.entity';
import { Transaction } from './entities/transaction.entity';
import { SubscribersModule } from '../subscribers/subscribers.module';
import { TenancyModule } from '../../core/tenancy/tenancy.module';
import { AuditModule } from '../../core/audit/audit.module';
import { NombaModule } from '../../core/nomba/nomba.module';
import { MerchantsModule } from '../merchants/merchants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, Transaction]),
    forwardRef(() => SubscribersModule),
    forwardRef(() => NombaModule),
    TenancyModule,
    AuditModule,
    forwardRef(() => MerchantsModule),
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
