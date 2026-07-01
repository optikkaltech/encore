import { Module, forwardRef } from '@nestjs/common';
import { NombaService } from './nomba.service';
import { NombaController } from './nomba.controller';
import { SubscribersModule } from '../../modules/subscribers/subscribers.module';

@Module({
  imports: [forwardRef(() => SubscribersModule)],
  controllers: [NombaController],
  providers: [NombaService],
  exports: [NombaService],
})
export class NombaModule {}
