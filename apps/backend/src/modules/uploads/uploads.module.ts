import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { StorageModule } from '../../core/storage/storage.module';
import { TenancyModule } from '../../core/tenancy';

@Module({
  imports: [StorageModule, TenancyModule],
  controllers: [UploadsController],
})
export class UploadsModule {}
