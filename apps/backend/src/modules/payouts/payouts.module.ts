import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayoutsController } from './payouts.controller';
import { PayoutsService } from './payouts.service';
import { Payout } from './entities/payout.entity';
import { MerchantLedger } from './entities/merchant-ledger.entity';
import { Transaction } from '../billing/entities/transaction.entity';
import { TenancyModule } from '../../core/tenancy/tenancy.module';
import { AuditModule } from '../../core/audit/audit.module';
import { NombaModule } from '../../core/nomba/nomba.module';
import { TransactionSubscriber } from './transaction.subscriber';
import { PayoutsBackfillService } from './payouts-backfill.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payout, MerchantLedger, Transaction]),
    TenancyModule,
    AuditModule,
    NombaModule,
  ],
  controllers: [PayoutsController],
  providers: [PayoutsService, TransactionSubscriber, PayoutsBackfillService],
  exports: [PayoutsService],
})
export class PayoutsModule {}
