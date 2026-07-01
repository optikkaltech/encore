import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant } from '../merchants/entities/merchant.entity';
import { Public } from '../../common/decorators/security.decorators';

/**
 * Public endpoint for portal white-labeling.
 * Returns merchant branding info so the portal can style itself dynamically.
 * No auth required — branding is public information.
 */
@Controller('portal/config')
@Public()
export class PortalConfigController {
  constructor(
    @InjectRepository(Merchant)
    private readonly merchantRepo: Repository<Merchant>,
  ) {}

  /**
   * GET /portal/config/:merchantId
   * Returns branding config for the white-labeled portal.
   */
  @Get(':merchantId')
  async getMerchantConfig(@Param('merchantId') merchantId: string) {
    const merchant = await this.merchantRepo.findOne({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new NotFoundException('Portal not found');
    }

    const settings = merchant.settings as any;

    return {
      merchantId: merchant.id,
      businessName: merchant.businessName,
      logoUrl: settings?.logoUrl || null,
      brandColor: settings?.brandColor || '#7c3aed',
      poweredBy: true, // TODO: false for white-label Scale tier
    };
  }
}
