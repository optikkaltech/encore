import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiCommandService } from './ai-command.service';
import { IsString, Length } from 'class-validator';
import { Secure } from '../../common/decorators/security.decorators';
import { TenantGuard } from '../../core/tenancy';
import { CurrentMerchant } from '../../core/tenancy';
import { Audit } from '../../core/audit';

export class AiCommandDto {
  @IsString()
  @Length(3, 500)
  query: string;
}

@Controller('ai')
@UseGuards(TenantGuard)
@Secure()
export class AiCommandController {
  constructor(private readonly aiCommandService: AiCommandService) {}

  @Post('command')
  @Audit({ action: 'AI_COMMAND_EXECUTE', entityType: 'merchant' })
  async executeCommand(
    @CurrentMerchant() merchantId: string,
    @Body() dto: AiCommandDto,
  ) {
    return this.aiCommandService.processQuery(merchantId, dto.query);
  }
}
