import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SubscribersService } from './subscribers.service';
import { PortalAuthService } from './portal-auth.service';
import {
  CreateSubscriberDto,
  CreateSubscriptionDto,
  UpdateSubscriberDto,
  BulkUploadDto,
  BulkSubscribeDto,
} from './dto/subscriber.dto';
import { Secure } from '../../common/decorators/security.decorators';
import { TenantGuard } from '../../core/tenancy';
import { CurrentMerchant } from '../../core/tenancy';
import { Audit } from '../../core/audit';

@Controller('subscribers')
@UseGuards(TenantGuard)
@Secure()
export class SubscribersController {
  constructor(
    private readonly subscribersService: SubscribersService,
    private readonly portalAuthService: PortalAuthService,
  ) {}

  @Post()
  @Audit({ action: 'SUBSCRIBER_CREATE', entityType: 'subscriber' })
  async create(
    @CurrentMerchant() merchantId: string,
    @Body() dto: CreateSubscriberDto,
  ) {
    const subscriber = await this.subscribersService.create(merchantId, dto);
    return {
      success: true,
      data: subscriber,
      message: 'Subscriber created successfully.',
    };
  }

  @Get()
  async findAll(@CurrentMerchant() merchantId: string) {
    const subscribers = await this.subscribersService.findAll(merchantId);
    return {
      success: true,
      data: subscribers,
    };
  }

  @Get('subscriptions')
  async findAllSubscriptions(@CurrentMerchant() merchantId: string) {
    const subscriptions =
      await this.subscribersService.findAllSubscriptions(merchantId);
    return {
      success: true,
      data: subscriptions,
    };
  }

  @Get(':id')
  async findOne(
    @CurrentMerchant() merchantId: string,
    @Param('id') id: string,
  ) {
    const subscriber = await this.subscribersService.findOne(merchantId, id);
    return {
      success: true,
      data: subscriber,
    };
  }

  @Post(':id/subscriptions')
  @Audit({ action: 'SUBSCRIPTION_CREATE', entityType: 'subscription' })
  async subscribeCustomer(
    @CurrentMerchant() merchantId: string,
    @Param('id') subscriberId: string,
    @Body() dto: CreateSubscriptionDto,
  ) {
    const subscription = await this.subscribersService.subscribeCustomer(
      merchantId,
      subscriberId,
      dto,
    );
    return {
      success: true,
      data: subscription,
      message: 'Customer subscribed to plan successfully.',
    };
  }

  @Post(':id/subscriptions/pause')
  @Audit({ action: 'SUBSCRIPTION_PAUSE', entityType: 'subscription' })
  async pauseSubscription(
    @CurrentMerchant() merchantId: string,
    @Param('id') subscriberId: string,
  ) {
    const subscription = await this.subscribersService.pauseSubscription(
      merchantId,
      subscriberId,
    );
    return {
      success: true,
      data: subscription,
      message: 'Subscription paused successfully.',
    };
  }

  @Post(':id/subscriptions/cancel')
  @Audit({ action: 'SUBSCRIPTION_CANCEL', entityType: 'subscription' })
  async cancelSubscription(
    @CurrentMerchant() merchantId: string,
    @Param('id') subscriberId: string,
  ) {
    const subscription = await this.subscribersService.cancelSubscription(
      merchantId,
      subscriberId,
    );
    return {
      success: true,
      data: subscription,
      message: 'Subscription cancelled successfully.',
    };
  }

  /** POST /subscribers/:id/portal-invite — send portal activation invite */
  @Post(':id/portal-invite')
  @Audit({ action: 'PORTAL_INVITE_SENT', entityType: 'subscriber' })
  async sendPortalInvite(
    @CurrentMerchant() merchantId: string,
    @Param('id') subscriberId: string,
  ) {
    const result = await this.portalAuthService.sendPortalInvite(
      merchantId,
      subscriberId,
    );
    return {
      success: true,
      data: result,
      message:
        'Portal invite sent. Share the invite token with your subscriber.',
    };
  }

  @Post(':id/virtual-account')
  @Audit({ action: 'SUBSCRIBER_VIRTUAL_ACCOUNT_GENERATE', entityType: 'subscriber' })
  async generateVirtualAccount(
    @CurrentMerchant() merchantId: string,
    @Param('id') id: string,
  ) {
    const subscriber = await this.subscribersService.generateVirtualAccount(
      merchantId,
      id,
    );
    return {
      success: true,
      data: subscriber,
      message: 'Virtual account generated successfully.',
    };
  }

  @Delete(':id/virtual-account')
  @Audit({ action: 'SUBSCRIBER_VIRTUAL_ACCOUNT_DELETE', entityType: 'subscriber' })
  async expireVirtualAccount(
    @CurrentMerchant() merchantId: string,
    @Param('id') id: string,
  ) {
    const subscriber = await this.subscribersService.expireVirtualAccount(
      merchantId,
      id,
    );
    return {
      success: true,
      data: subscriber,
      message: 'Virtual account expired/deleted successfully.',
    };
  }

  @Patch(':id')
  @Audit({ action: 'SUBSCRIBER_UPDATE', entityType: 'subscriber' })
  async update(
    @CurrentMerchant() merchantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSubscriberDto,
  ) {
    const subscriber = await this.subscribersService.update(merchantId, id, dto);
    return {
      success: true,
      data: subscriber,
      message: 'Subscriber updated successfully.',
    };
  }

  @Post('bulk-upload')
  @Audit({ action: 'SUBSCRIBER_BULK_UPLOAD', entityType: 'subscriber' })
  async bulkUpload(
    @CurrentMerchant() merchantId: string,
    @Body() dto: BulkUploadDto,
  ) {
    const result = await this.subscribersService.bulkCreate(
      merchantId,
      dto.subscribers,
    );
    return {
      success: true,
      data: result,
      message: `Successfully uploaded ${result.successCount} subscribers.`,
    };
  }

  @Post('bulk-subscribe')
  @Audit({ action: 'SUBSCRIPTION_BULK_CREATE', entityType: 'subscription' })
  async bulkSubscribe(
    @CurrentMerchant() merchantId: string,
    @Body() dto: BulkSubscribeDto,
  ) {
    const result = await this.subscribersService.bulkSubscribe(
      merchantId,
      dto.subscriberIds,
      dto.planId,
    );
    return {
      success: true,
      data: result,
      message: `Successfully subscribed ${result.successCount} subscribers to plan.`,
    };
  }

  @Delete(':id')
  @Audit({ action: 'SUBSCRIBER_DELETE', entityType: 'subscriber' })
  async remove(
    @CurrentMerchant() merchantId: string,
    @Param('id') id: string,
  ) {
    await this.subscribersService.remove(merchantId, id);
    return {
      success: true,
      message: 'Subscriber deleted successfully.',
    };
  }
}
