import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { randomBytes } from 'crypto';
import { Public } from '../../common/decorators/security.decorators';
import { IsString, IsEmail } from 'class-validator';
import { Plan } from '../plans/entities/plan.entity';
import { Subscriber } from './entities/subscriber.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { EmailService } from '../../core/email/email.service';
import { SubscriptionStatus } from '../../shared/enums';
import { hashEmail } from '../../common/utils/security.utils';

class SelfEnrollDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;
}

/**
 * Public plan checkout — no merchant auth required.
 * GET  /checkout/:planId  → plan + merchant branding for the checkout page
 * POST /checkout/:planId  → subscriber self-enrolls
 */
@Controller('checkout')
@Public()
export class CheckoutController {
  constructor(
    @InjectRepository(Plan) private readonly planRepo: Repository<Plan>,
    @InjectRepository(Subscriber)
    private readonly subscriberRepo: Repository<Subscriber>,
    @InjectRepository(Merchant)
    private readonly merchantRepo: Repository<Merchant>,
    private readonly emailService: EmailService,
  ) {}

  /** GET /checkout/:planId — plan details for the public checkout page */
  @Get(':planId')
  async getPlanForCheckout(@Param('planId') planId: string) {
    const plan = await this.planRepo.findOne({
      where: { id: planId, isActive: true, deletedAt: IsNull() },
    });
    if (!plan)
      throw new NotFoundException('Plan not found or no longer available');

    const merchant = await this.merchantRepo.findOne({
      where: { id: plan.merchantId },
    });
    const settings = merchant?.settings as any;

    return {
      planId: plan.id,
      planName: plan.name,
      description: plan.description,
      amount: Number(plan.amount),
      currency: plan.currency || 'NGN',
      frequency: plan.frequency,
      trialDays: plan.trialDays || 0,
      setupFee: Number(plan.setupFee) || 0,
      merchant: {
        merchantId: plan.merchantId,
        businessName: merchant?.businessName || 'Your Provider',
        logoUrl: settings?.logoUrl || null,
        brandColor: settings?.brandColor || '#7c3aed',
      },
    };
  }

  /** POST /checkout/:planId — subscriber self-enrolls via public plan link */
  @Post(':planId')
  async selfEnroll(
    @Param('planId') planId: string,
    @Body() dto: SelfEnrollDto,
  ) {
    const plan = await this.planRepo.findOne({
      where: { id: planId, isActive: true, deletedAt: IsNull() },
    });
    if (!plan)
      throw new NotFoundException('Plan not found or no longer available');

    // Check if this email already subscribed to this merchant
    const existing = await this.subscriberRepo.findOne({
      where: { merchantId: plan.merchantId, emailHash: hashEmail(dto.email.toLowerCase().trim()) },
    });
    if (existing) {
      throw new ConflictException(
        'This email is already registered with this provider. Please log into your portal or contact your provider.',
      );
    }

    const merchant = await this.merchantRepo.findOne({
      where: { id: plan.merchantId },
    });
    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    // Enforce pricing plan subscriber capacity limits
    const actualCount = await this.subscriberRepo.count({
      where: { merchantId: plan.merchantId },
    });
    if (merchant.maxSubscribers !== -1 && actualCount >= merchant.maxSubscribers) {
      throw new BadRequestException(
        `Subscriber limit of ${merchant.maxSubscribers} reached for this provider.`,
      );
    }


    // Create subscriber record
    const inviteToken = randomBytes(32).toString('hex');
    const inviteExpiry = new Date();
    inviteExpiry.setHours(inviteExpiry.getHours() + 72);

    const subscriber = this.subscriberRepo.create({
      merchantId: plan.merchantId,
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      status: SubscriptionStatus.ACTIVE,
      portalInviteToken: inviteToken,
      portalInviteExpires: inviteExpiry,
      metadata: { enrolledViaPlanLink: true, planId },
    });
    await this.subscriberRepo.save(subscriber);

    // Fire onboarding email
    const setupUrl = `${process.env.FRONTEND_URL}/setup?token=${inviteToken}&merchant=${plan.merchantId}`;
    const amount = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: plan.currency || 'NGN',
    }).format(Number(plan.amount));

    this.emailService
      .sendSubscriberOnboardingEmail(
        subscriber.email,
        `${subscriber.firstName} ${subscriber.lastName}`,
        merchant?.businessName || 'Your Provider',
        plan.name,
        amount,
        plan.frequency,
        setupUrl,
        plan.trialDays,
      )
      .catch((err) => console.error('Onboarding email failed:', err.message));

    return {
      success: true,
      message:
        "You're almost there! Check your email to complete your subscription setup.",
    };
  }
}
