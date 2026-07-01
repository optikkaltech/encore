import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PlansService } from './plans.service';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';
import { Secure } from '../../common/decorators/security.decorators';
import { TenantGuard } from '../../core/tenancy';
import { CurrentMerchant } from '../../core/tenancy';
import { Audit } from '../../core/audit';

@Controller('plans')
@UseGuards(TenantGuard)
@Secure()
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  @Audit({ action: 'PLAN_CREATE', entityType: 'plan' })
  async create(
    @CurrentMerchant() merchantId: string,
    @Body() dto: CreatePlanDto,
  ) {
    const plan = await this.plansService.create(merchantId, dto);
    return {
      success: true,
      data: plan,
      message: 'Plan created successfully.',
    };
  }

  @Get()
  async findAll(@CurrentMerchant() merchantId: string) {
    const plans = await this.plansService.findAll(merchantId);
    return {
      success: true,
      data: plans,
    };
  }

  @Get(':id')
  async findOne(
    @CurrentMerchant() merchantId: string,
    @Param('id') id: string,
  ) {
    const plan = await this.plansService.findOne(merchantId, id);
    return {
      success: true,
      data: plan,
    };
  }

  @Patch(':id')
  @Audit({ action: 'PLAN_UPDATE', entityType: 'plan' })
  async update(
    @CurrentMerchant() merchantId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePlanDto,
  ) {
    const plan = await this.plansService.update(merchantId, id, dto);
    return {
      success: true,
      data: plan,
      message: 'Plan updated successfully.',
    };
  }

  @Delete(':id')
  @Audit({ action: 'PLAN_DELETE', entityType: 'plan' })
  async remove(@CurrentMerchant() merchantId: string, @Param('id') id: string) {
    await this.plansService.remove(merchantId, id);
    return {
      success: true,
      message: 'Plan deleted successfully.',
    };
  }
}
