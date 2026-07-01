import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { TenantThrottlerGuard } from './tenant-throttler.guard';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [
          {
            ttl: 60, // 60 seconds
            limit: 100, // 100 requests
          },
        ],
      }),
    }),
  ],
  providers: [TenantThrottlerGuard],
  exports: [ThrottlerModule, TenantThrottlerGuard],
})
export class SecurityModule {}
