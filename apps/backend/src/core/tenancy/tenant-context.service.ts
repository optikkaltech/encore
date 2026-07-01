import { Injectable, Scope } from '@nestjs/common';
import { TenantContext } from '../../shared/interfaces';

/**
 * TenantContextService provides request-scoped tenant information.
 * This ensures strict data isolation between merchants.
 *
 * Scope.REQUEST means each HTTP request gets its own instance,
 * preventing data leakage between concurrent requests.
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  private tenantContext: TenantContext | null = null;

  setTenant(context: TenantContext): void {
    this.tenantContext = context;
  }

  getTenant(): TenantContext {
    if (!this.tenantContext) {
      throw new Error('Tenant context not set - ensure TenantGuard is applied');
    }
    return this.tenantContext;
  }

  getMerchantId(): string {
    return this.getTenant().merchantId;
  }

  isSuperAdmin(): boolean {
    return this.getTenant().isSuperAdmin;
  }

  clear(): void {
    this.tenantContext = null;
  }
}
