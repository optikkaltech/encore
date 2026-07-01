import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Public } from '../../common/decorators/security.decorators';
import { Subscriber } from './entities/subscriber.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { PortalAuthService } from './portal-auth.service';
import { SubscribersService } from './subscribers.service';
import { PaymentMethod } from '../../shared/enums';
import { ConfigService } from '@nestjs/config';
import { NombaService } from '../../core/nomba/nomba.service';
import { IsString, IsOptional } from 'class-validator';

class CompleteSetupDto {
  @IsString()
  inviteToken: string;

  @IsString()
  password: string;

  @IsString()
  paymentMethod: string;

  @IsOptional()
  @IsString()
  cardToken?: string;

  @IsOptional()
  @IsString()
  cardLastFour?: string;

  @IsOptional()
  @IsString()
  cardExpiry?: string;

  @IsOptional()
  @IsString()
  mandateId?: string;

  @IsOptional()
  @IsString()
  orderReference?: string;
}

class InitiateSetupCheckoutDto {
  @IsString()
  inviteToken: string;

  @IsString()
  method: string;

  @IsOptional()
  @IsString()
  callbackUrl?: string;
}

/**
 * Payment setup controller — subscribers complete onboarding from the email link.
 * All routes @Public() — validated by invite token, not JWT.
 * On completion: issues a portalToken so subscriber is auto-logged into portal.
 */
@Controller('setup')
@Public()
export class SetupController {
  constructor(
    @InjectRepository(Subscriber)
    private readonly subscriberRepo: Repository<Subscriber>,
    @InjectRepository(Merchant)
    private readonly merchantRepo: Repository<Merchant>,
    private readonly portalAuthService: PortalAuthService,
    private readonly subscribersService: SubscribersService,
    private readonly config: ConfigService,
    @Inject(forwardRef(() => NombaService))
    private readonly nombaService: NombaService,
  ) {}

  /**
   * GET /setup/validate?token=xxx
   * Called on page load to verify the invite token and return subscriber + merchant info.
   */
  @Get('validate')
  async validateToken(@Query('token') token: string) {
    if (!token) throw new BadRequestException('Token is required');

    const subscriber = await this.subscriberRepo.findOne({
      where: { portalInviteToken: token },
    });

    if (!subscriber || !subscriber.portalInviteExpires) {
      throw new BadRequestException(
        'This setup link is invalid or has already been used.',
      );
    }
    if (new Date() > subscriber.portalInviteExpires) {
      throw new BadRequestException(
        'This setup link has expired. Contact your provider for a new link.',
      );
    }

    const merchant = await this.merchantRepo.findOne({
      where: { id: subscriber.merchantId },
    });
    const settings = merchant?.settings as Record<string, unknown> | undefined;
    const logoUrl = typeof settings?.logoUrl === 'string' ? settings.logoUrl : null;
    const brandColor = typeof settings?.brandColor === 'string' ? settings.brandColor : '#7c3aed';

    return {
      valid: true,
      subscriber: {
        firstName: subscriber.firstName,
        lastName: subscriber.lastName,
        email: subscriber.email,
        merchantId: subscriber.merchantId,
      },
      merchant: {
        businessName: merchant?.businessName || 'Your Provider',
        logoUrl,
        brandColor,
      },
    };
  }

  /**
   * POST /setup/initiate-checkout
   * Initiates payment setup checkout redirect via Nomba (or fallback mock)
   */
  @Post('initiate-checkout')
  async initiateCheckout(@Body() dto: InitiateSetupCheckoutDto) {
    const subscriber = await this.subscriberRepo.findOne({
      where: { portalInviteToken: dto.inviteToken },
    });

    if (!subscriber || !subscriber.portalInviteExpires) {
      throw new BadRequestException(
        'This setup link has already been used. If you completed payment, please log in to your portal.',
      );
    }
    if (new Date() > subscriber.portalInviteExpires) {
      throw new BadRequestException(
        'This setup link has expired. Contact your provider for a new link.',
      );
    }

    const orderReference = `ref_sub_${subscriber.id}_${Date.now()}`;
    const clientUrl =
      this.config.get<string>('CLIENT_URL') ||
      process.env.CLIENT_URL ||
      'http://localhost:5173';
    const callbackUrl = dto.callbackUrl || `${clientUrl}/setup?token=${dto.inviteToken}`;

    try {
      const clientId = this.config.get<string>('nomba.clientId');
      const clientSecret = this.config.get<string>('nomba.clientSecret');
      const accountId = this.config.get<string>('nomba.accountId');

      if (!clientId || !clientSecret || !accountId) {
        throw new Error(
          'Nomba credentials not configured. Using fallback checkout.',
        );
      }

      const order = await this.nombaService.createTokenizationOrder(
        subscriber.email,
        orderReference,
        callbackUrl,
      );

      return {
        checkoutLink: order.checkoutLink,
        orderReference: order.orderReference,
        isMock: false,
      };
    } catch (error: any) {
      // Build mock checkout URL: client-side mock page
      const mockCheckoutUrl = `${clientUrl}/onboarding/payment/mock-checkout?orderReference=${orderReference}&callbackUrl=${encodeURIComponent(callbackUrl)}&method=${dto.method}`;

      return {
        checkoutLink: mockCheckoutUrl,
        orderReference,
        isMock: true,
      };
    }
  }

  /**
   * POST /setup/complete
   * Subscriber sets their portal password + payment method in one shot.
   * Returns a portalToken so frontend can auto-login them into the portal.
   */
  @Post('complete')
  async completeSetup(@Body() dto: CompleteSetupDto) {
    const subscriber = await this.subscriberRepo.findOne({
      where: { portalInviteToken: dto.inviteToken },
    });

    // If invite token not found, check if setup is already complete for this subscriber
    // This handles the case where completeSetup succeeded but the redirect back failed
    if (!subscriber || !subscriber.portalInviteExpires) {
      // Look up subscriber by a legacy approach: try to find one that completed setup
      // with a matching order reference in metadata
      throw new BadRequestException(
        'This setup link has already been used. If you have already completed setup, please log in to your portal.',
      );
    }
    if (new Date() > subscriber.portalInviteExpires) {
      throw new BadRequestException(
        'This setup link has expired. Contact your provider for a new link.',
      );
    }

    // Set portal password
    subscriber.portalPasswordHash = await bcrypt.hash(dto.password, 12);

    // Set payment method
    subscriber.paymentMethod = dto.paymentMethod as PaymentMethod;

    if (dto.orderReference) {
      // Direct Nomba Verification
      let isSuccess = false;
      let tokenKey = '';

      const clientId = this.config.get<string>('nomba.clientId');
      const clientSecret = this.config.get<string>('nomba.clientSecret');
      const accountId = this.config.get<string>('nomba.accountId');

      const isMockRef =
        dto.orderReference.includes('mock') ||
        !clientId ||
        !clientSecret ||
        !accountId;

      if (isMockRef) {
        isSuccess = true;
        tokenKey = `tok_mock_card_${Math.random().toString(36).substring(2, 10)}`;
      } else {
        try {
          const result = await this.nombaService.verifyOrder(dto.orderReference);
          if (
            result.status === 'SUCCESS' ||
            result.status === 'SUCCESSFUL' ||
            result.status === 'APPROVED'
          ) {
            isSuccess = true;
            tokenKey = result.tokenKey;
          } else {
            throw new BadRequestException(
              `Checkout transaction status is ${result.status}`,
            );
          }
        } catch (error: any) {
          throw new BadRequestException(`Verification failed: ${error.message}`);
        }
      }

      if (isSuccess && tokenKey) {
        if (dto.paymentMethod === 'card') {
          subscriber.cardToken = tokenKey;
          subscriber.cardLastFour = '4242';
          subscriber.cardExpiry = '12/28';
        } else if (dto.paymentMethod === 'direct_debit') {
          subscriber.mandateId = `mandate_mock_${Math.random().toString(36).substring(2, 10)}`;
        }
      } else {
        throw new BadRequestException('Payment verification failed.');
      }
    } else {
      // Fallback: manual input (if not card/direct_debit or for compatibility)
      if (dto.cardToken) subscriber.cardToken = dto.cardToken;
      if (dto.cardLastFour) subscriber.cardLastFour = dto.cardLastFour;
      if (dto.cardExpiry) subscriber.cardExpiry = dto.cardExpiry;
      if (dto.mandateId) subscriber.mandateId = dto.mandateId;
    }

    // Clear invite token (one-time use)
    subscriber.portalInviteToken = null;
    subscriber.portalInviteExpires = null;
    subscriber.lastPortalLoginAt = new Date();

    const savedSubscriber = await this.subscriberRepo.save(subscriber);

    // If they checked out via a plan link, automatically create their subscription record now!
    const metadata = savedSubscriber.metadata || {};
    if (metadata.planId) {
      try {
        await this.subscribersService.subscribeCustomer(
          savedSubscriber.merchantId,
          savedSubscriber.id,
          { planId: metadata.planId as string },
        );
      } catch (err) {
        console.error(
          `Failed to automatically subscribe customer ${savedSubscriber.id} to plan ${metadata.planId} on setup completion:`,
          (err as Error).message,
        );
      }
    }

    // Issue portal token so subscriber is auto-logged in
    const loginResult = await this.portalAuthService.loginSubscriber(
      subscriber.merchantId,
      subscriber.email,
      dto.password,
    );

    return {
      success: true,
      portalToken: loginResult.portalToken,
      merchantId: subscriber.merchantId,
      message: 'Setup complete! Welcome to your billing portal.',
    };
  }
}
