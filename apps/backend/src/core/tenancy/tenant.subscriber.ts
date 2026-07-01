import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { TenantContextService } from './tenant-context.service';
import { ITenantEntity } from '../../shared/interfaces';

/**
 * TenantSubscriber automatically injects merchantId into all tenant-scoped entities.
 * This provides defense-in-depth for multi-tenancy - even if code forgets to set
 * merchantId, the database will have it set automatically.
 */
@EventSubscriber()
export class TenantSubscriber implements EntitySubscriberInterface {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantContext: TenantContextService,
  ) {}

  beforeInsert(event: InsertEvent<ITenantEntity>): void {
    // Skip if super admin operations or no tenant context
    if (!this.tenantContext || this.tenantContext.isSuperAdmin()) {
      return;
    }

    const entity = event.entity;

    // Only apply to tenant-scoped entities
    if (this.isTenantEntity(entity)) {
      // If merchantId is not set, set it from context
      if (!entity.merchantId) {
        entity.merchantId = this.tenantContext.getMerchantId();
      }

      // Security check: ensure entity's merchantId matches context
      if (entity.merchantId !== this.tenantContext.getMerchantId()) {
        throw new Error(
          `Cross-tenant data access attempted: ${entity.merchantId} vs ${this.tenantContext.getMerchantId()}`,
        );
      }
    }
  }

  beforeUpdate(event: UpdateEvent<ITenantEntity>): void {
    // Similar protection for updates
    if (!this.tenantContext || this.tenantContext.isSuperAdmin()) {
      return;
    }

    const entity = event.entity as ITenantEntity | undefined;

    if (entity && this.isTenantEntity(entity)) {
      if (
        entity.merchantId &&
        entity.merchantId !== this.tenantContext.getMerchantId()
      ) {
        throw new Error(
          `Cross-tenant update attempted: ${entity.merchantId} vs ${this.tenantContext.getMerchantId()}`,
        );
      }
    }
  }

  private isTenantEntity(entity: unknown): entity is ITenantEntity {
    return (
      entity !== null && typeof entity === 'object' && 'merchantId' in entity
    );
  }
}
