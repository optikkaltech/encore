import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { DunningService } from './dunning.service';
import { Secure, Public } from '../../common/decorators/security.decorators';
import { TenantGuard } from '../../core/tenancy';
import { CurrentMerchant } from '../../core/tenancy';
import { Audit } from '../../core/audit';

@Controller('dunning')
@UseGuards(TenantGuard)
@Secure()
export class DunningController {
  constructor(private readonly dunningService: DunningService) {}

  @Get()
  async findAll(@CurrentMerchant() merchantId: string) {
    const logs = await this.dunningService.findAll(merchantId);
    return {
      success: true,
      data: logs,
    };
  }

  @Post(':id/retry')
  @Audit({ action: 'DUNNING_RETRY_TRIGGERED', entityType: 'dunning' })
  async manualRetry(
    @CurrentMerchant() merchantId: string,
    @Param('id') dunningId: string,
  ) {
    const log = await this.dunningService.manualRetry(merchantId, dunningId);
    return {
      success: true,
      data: log,
      message: 'Retry attempt completed.',
    };
  }

  @Post(':id/cancel')
  @Audit({ action: 'DUNNING_CANCELLED', entityType: 'dunning' })
  async cancelDunning(
    @CurrentMerchant() merchantId: string,
    @Param('id') dunningId: string,
  ) {
    const log = await this.dunningService.cancelDunning(merchantId, dunningId);
    return {
      success: true,
      data: log,
      message: 'Dunning recovery cancelled and subscriber suspended.',
    };
  }
}
