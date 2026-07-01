import { Controller, Get, UseGuards } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { Secure } from '../../common/decorators/security.decorators';
import { TenantGuard } from '../../core/tenancy';

@Controller('system-configs')
@UseGuards(TenantGuard)
@Secure()
export class SystemConfigController {
  constructor(private readonly configService: SystemConfigService) {}

  @Get()
  async getAllConfigs() {
    const configs = await this.configService.getAll();
    return {
      success: true,
      data: configs,
    };
  }
}
