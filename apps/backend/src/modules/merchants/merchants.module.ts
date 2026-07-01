import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerchantsController } from './merchants.controller';
import { MerchantsService } from './merchants.service';
import { Merchant } from './entities/merchant.entity';
import { AuditModule } from '../../core/audit/audit.module';
import { TenancyModule } from '../../core/tenancy/tenancy.module';
import { SystemConfigModule } from '../system-config/system-config.module';
import { NombaModule } from '../../core/nomba/nomba.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Merchant]),
    AuditModule,
    TenancyModule,
    SystemConfigModule,
    NombaModule,
  ],
  controllers: [MerchantsController],
  providers: [MerchantsService],
  exports: [MerchantsService],
})
export class MerchantsModule {}
