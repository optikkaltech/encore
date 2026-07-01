import { Module, Scope } from '@nestjs/common';
import { TenantContextService } from './tenant-context.service';
import { TenantGuard } from './tenant.guard';

/**
 * TenancyModule provides multi-tenant isolation capabilities.
 *
 * The TenantContextService is request-scoped (Scope.REQUEST) to ensure
 * strict isolation between concurrent requests from different merchants.
 */
@Module({
  providers: [
    {
      provide: TenantContextService,
      useClass: TenantContextService,
      scope: Scope.REQUEST,
    },
    TenantGuard,
  ],
  exports: [TenantContextService, TenantGuard],
})
export class TenancyModule {}
