import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { randomBytes } from 'crypto';
import { Subscriber } from './entities/subscriber.entity';
import { Subscription } from './entities/subscription.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import {
  CreateSubscriberDto,
  CreateSubscriptionDto,
  UpdateSubscriberDto,
} from './dto/subscriber.dto';
import { PlansService } from '../plans/plans.service';
import {
  SubscriptionStatus,
  BillingFrequency,
  PaymentMethod,
} from '../../shared/enums';
import { NombaService } from '../../core/nomba/nomba.service';
import { BillingService } from '../billing/billing.service';
import { EmailService } from '../../core/email/email.service';
import { hashEmail } from '../../common/utils/security.utils';

@Injectable()
export class SubscribersService {
  constructor(
    @InjectRepository(Subscriber)
    private readonly subscriberRepo: Repository<Subscriber>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Merchant)
    private readonly merchantRepo: Repository<Merchant>,
    private readonly plansService: PlansService,
    private readonly nombaService: NombaService,
    @Inject(forwardRef(() => BillingService))
    private readonly billingService: BillingService,
    @Inject(forwardRef(() => EmailService))
    private readonly emailService: EmailService,
  ) {}

  async create(
    merchantId: string,
    dto: CreateSubscriberDto,
  ): Promise<Subscriber> {
    const merchant = await this.merchantRepo.findOne({ where: { id: merchantId } });
    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    // Enforce pricing plan subscriber capacity limits
    const actualCount = await this.subscriberRepo.count({ where: { merchantId } });
    if (merchant.maxSubscribers !== -1 && actualCount >= merchant.maxSubscribers) {
      throw new BadRequestException(
        `Subscriber limit of ${merchant.maxSubscribers} reached for your plan. Please upgrade your subscription plan under Settings.`,
      );
    }

    const existing = await this.subscriberRepo.findOne({
      where: { merchantId, emailHash: hashEmail(dto.email.toLowerCase().trim()) },
    });
    if (existing) {
      throw new ConflictException(
        `Subscriber with email '${dto.email}' already registered.`,
      );
    }

    const subscriber = this.subscriberRepo.create({
      ...dto,
      merchantId,
      status: SubscriptionStatus.ACTIVE,
    });

    const saved = await this.subscriberRepo.save(subscriber);

    // Auto-generate portal invite token (72h) so subscriber can set up payment + portal
    const inviteToken = randomBytes(32).toString('hex');
    const inviteExpiry = new Date();
    inviteExpiry.setHours(inviteExpiry.getHours() + 72);
    saved.portalInviteToken = inviteToken;
    saved.portalInviteExpires = inviteExpiry;
    await this.subscriberRepo.save(saved);

    // Create virtual account for reconciliation (calling generateVirtualAccount)
    try {
      const updated = await this.generateVirtualAccount(merchantId, saved.id);
      saved.virtualAccountNumber = updated.virtualAccountNumber;
      saved.virtualAccountBank = updated.virtualAccountBank;
      saved.virtualAccountId = updated.virtualAccountId;
    } catch (err) {
      const error = err as Error;
      console.error(
        `Failed to generate Nomba virtual account for subscriber ${saved.id}:`,
        error.message,
      );
    }



    return saved;
  }

  async generateVirtualAccount(
    merchantId: string,
    id: string,
  ): Promise<Subscriber> {
    const subscriber = await this.findOne(merchantId, id);

    if (subscriber.virtualAccountNumber) {
      throw new BadRequestException('Subscriber already has a virtual account.');
    }

    const vaRef = `va_${subscriber.id}_${Date.now()}`;
    const va = await this.nombaService.createVirtualAccount(
      subscriber.email,
      subscriber.phone,
      subscriber.firstName,
      subscriber.lastName,
      vaRef,
    );

    subscriber.virtualAccountNumber = va.virtualAccountNumber;
    subscriber.virtualAccountBank = va.virtualAccountBank;
    subscriber.virtualAccountId = va.virtualAccountId;

    return this.subscriberRepo.save(subscriber);
  }

  async expireVirtualAccount(
    merchantId: string,
    id: string,
  ): Promise<Subscriber> {
    const subscriber = await this.findOne(merchantId, id);

    if (!subscriber.virtualAccountId && !subscriber.virtualAccountNumber) {
      throw new BadRequestException(
        'Subscriber does not have an active virtual account.',
      );
    }

    try {
      await this.nombaService.expireVirtualAccount(
        (subscriber.virtualAccountId || subscriber.virtualAccountNumber)!,
      );
    } catch (err) {
      const error = err as Error;
      console.error(
        `Failed to expire Nomba virtual account for subscriber ${id}:`,
        error.message,
      );
      throw new BadRequestException(
        `Failed to expire Nomba virtual account: ${error.message}`,
      );
    }

    subscriber.virtualAccountNumber = null;
    subscriber.virtualAccountBank = null;
    subscriber.virtualAccountId = null;

    return this.subscriberRepo.save(subscriber);
  }

  async findAll(merchantId: string): Promise<Subscriber[]> {
    return this.subscriberRepo.find({
      where: { merchantId, deletedAt: IsNull() },
      relations: { subscriptions: { plan: true } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(merchantId: string, id: string): Promise<Subscriber> {
    const subscriber = await this.subscriberRepo.findOne({
      where: { id, merchantId, deletedAt: IsNull() },
      relations: { subscriptions: { plan: true } },
    });
    if (!subscriber) {
      throw new NotFoundException(`Subscriber with ID '${id}' not found.`);
    }
    return subscriber;
  }

  async subscribeCustomer(
    merchantId: string,
    subscriberId: string,
    dto: CreateSubscriptionDto,
  ): Promise<Subscription> {
    const subscriber = await this.findOne(merchantId, subscriberId);
    const plan = await this.plansService.findOne(merchantId, dto.planId);

    if (!plan.isActive) {
      throw new BadRequestException('Selected billing plan is not active.');
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const currentPeriodStart = new Date(startDate);
    const currentPeriodEnd = this.calculateNextBillingDate(
      startDate,
      plan.frequency,
      plan.customDays,
    );

    const subscription = this.subscriptionRepo.create({
      merchantId,
      subscriberId,
      planId: plan.id,
      status: SubscriptionStatus.ACTIVE,
      planAmount: plan.amount,
      discountAmount: 0,
      finalAmount: plan.amount,
      startDate,
      currentPeriodStart,
      currentPeriodEnd,
    });

    const savedSubscription = await this.subscriptionRepo.save(subscription);

    // Update subscriber details
    subscriber.status = SubscriptionStatus.ACTIVE;
    subscriber.nextBillingDate = currentPeriodEnd;
    subscriber.lastBillingDate = currentPeriodStart;
    
    // Crucial: Push savedSubscription to avoid TypeORM relation deletion
    if (!subscriber.subscriptions) {
      subscriber.subscriptions = [];
    }
    subscriber.subscriptions.push(savedSubscription);
    await this.subscriberRepo.save(subscriber);

    // Fetch merchant business name dynamically
    let merchantName = 'Your Provider';
    try {
      const merchant = await this.merchantRepo.findOne({ where: { id: merchantId } });
      if (merchant) {
        merchantName = merchant.businessName;
      }
    } catch (err) {
      console.error(`Failed to fetch merchant for onboarding email:`, (err as Error).message);
    }

    // Trigger onboarding email if subscriber hasn't completed portal setup yet
    if (!subscriber.portalPasswordHash) {
      let inviteToken = subscriber.portalInviteToken;
      if (!inviteToken || !subscriber.portalInviteExpires || subscriber.portalInviteExpires < new Date()) {
        inviteToken = randomBytes(32).toString('hex');
        const inviteExpiry = new Date();
        inviteExpiry.setHours(inviteExpiry.getHours() + 72);
        subscriber.portalInviteToken = inviteToken;
        subscriber.portalInviteExpires = inviteExpiry;
        await this.subscriberRepo.save(subscriber);
      }

      const setupUrl = `${process.env.FRONTEND_URL}/setup?token=${inviteToken}&merchant=${merchantId}`;
      const formattedAmount = new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: plan.currency || 'NGN',
      }).format(Number(plan.amount));

      this.emailService
        .sendSubscriberOnboardingEmail(
          subscriber.email,
          `${subscriber.firstName} ${subscriber.lastName}`,
          merchantName,
          plan.name,
          formattedAmount,
          plan.frequency.toLowerCase(),
          setupUrl,
          plan.trialDays,
        )
        .catch((err: unknown) => {
          console.error(
            `Failed to send onboarding email for subscriber ${subscriber.id}:`,
            (err as Error).message,
          );
        });
    }

    // Automatically generate invoice for the newly created subscription
    try {
      await this.billingService.createSubscriptionInvoice(
        merchantId,
        subscriber.id,
        savedSubscription.id,
        plan.amount,
        subscriber.paymentMethod,
        true,
      );
    } catch (err) {
      console.error(
        `Failed to generate initial subscription invoice for subscriber ${subscriber.id}:`,
        (err as Error).message,
      );
    }

    return savedSubscription;
  }

  async findAllSubscriptions(merchantId: string): Promise<Subscription[]> {
    return this.subscriptionRepo.find({
      where: { merchantId },
      relations: { subscriber: true, plan: true },
      order: { createdAt: 'DESC' },
    });
  }

  private calculateNextBillingDate(
    startDate: Date,
    frequency: BillingFrequency,
    customDays?: number,
  ): Date {
    const nextDate = new Date(startDate);
    switch (frequency) {
      case BillingFrequency.WEEKLY:
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case BillingFrequency.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case BillingFrequency.QUARTERLY:
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case BillingFrequency.SEMI_ANNUAL:
        nextDate.setMonth(nextDate.getMonth() + 6);
        break;
      case BillingFrequency.ANNUAL:
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      case BillingFrequency.CUSTOM:
        nextDate.setDate(nextDate.getDate() + (customDays || 30));
        break;
      default:
        nextDate.setMonth(nextDate.getMonth() + 1);
    }
    return nextDate;
  }

  async pauseSubscription(
    merchantId: string,
    subscriberId: string,
  ): Promise<Subscription> {
    const subscriber = await this.findOne(merchantId, subscriberId);
    const activeSubscription = subscriber.subscriptions?.find(
      (s) =>
        s.status === SubscriptionStatus.ACTIVE ||
        s.status === SubscriptionStatus.TRIAL,
    );

    if (!activeSubscription) {
      throw new BadRequestException(
        'No active or trial subscription found to pause.',
      );
    }

    activeSubscription.status = SubscriptionStatus.PAUSED;
    activeSubscription.pausedAt = new Date();
    await this.subscriptionRepo.save(activeSubscription);

    subscriber.status = SubscriptionStatus.PAUSED;
    await this.subscriberRepo.save(subscriber);

    return activeSubscription;
  }

  async cancelSubscription(
    merchantId: string,
    subscriberId: string,
  ): Promise<Subscription> {
    const subscriber = await this.findOne(merchantId, subscriberId);
    const activeSubscription = subscriber.subscriptions?.find(
      (s) =>
        s.status === SubscriptionStatus.ACTIVE ||
        s.status === SubscriptionStatus.PAUSED ||
        s.status === SubscriptionStatus.TRIAL,
    );

    if (!activeSubscription) {
      throw new BadRequestException(
        'No active, paused, or trial subscription found to cancel.',
      );
    }

    activeSubscription.status = SubscriptionStatus.CANCELLED;
    activeSubscription.cancelledAt = new Date();
    await this.subscriptionRepo.save(activeSubscription);

    subscriber.status = SubscriptionStatus.CANCELLED;
    subscriber.nextBillingDate = null;
    await this.subscriberRepo.save(subscriber);

    return activeSubscription;
  }

  async handleIncomingVirtualAccountPayment(
    virtualAccountNumber: string,
    amount: number,
    _paymentReference: string,
  ): Promise<void> {
    const subscriber = await this.subscriberRepo.findOne({
      where: { virtualAccountNumber, deletedAt: IsNull() },
      relations: { subscriptions: { plan: true } },
    });

    if (!subscriber) {
      throw new NotFoundException(
        `Subscriber with Virtual Account ${virtualAccountNumber} not found.`,
      );
    }

    const activeSubscription = subscriber.subscriptions?.find(
      (s) =>
        s.status === SubscriptionStatus.ACTIVE ||
        s.status === SubscriptionStatus.PAUSED ||
        s.status === SubscriptionStatus.TRIAL,
    );

    if (!activeSubscription) {
      throw new BadRequestException(
        `No active or paused subscription found for subscriber ${subscriber.id}.`,
      );
    }

    // Call BillingService to record successful transaction & generate invoice
    await this.billingService.createSubscriptionInvoice(
      subscriber.merchantId,
      subscriber.id,
      activeSubscription.id,
      amount,
      PaymentMethod.VIRTUAL_ACCOUNT,
    );

    // Calculate new billing dates based on frequency
    const newPeriodStart = new Date();
    const newPeriodEnd = this.calculateNextBillingDate(
      newPeriodStart,
      activeSubscription.plan.frequency,
      activeSubscription.plan.customDays,
    );

    // Update Subscription
    activeSubscription.status = SubscriptionStatus.ACTIVE;
    activeSubscription.currentPeriodStart = newPeriodStart;
    activeSubscription.currentPeriodEnd = newPeriodEnd;
    await this.subscriptionRepo.save(activeSubscription);

    // Update Subscriber
    subscriber.status = SubscriptionStatus.ACTIVE;
    subscriber.lastBillingDate = newPeriodStart;
    subscriber.nextBillingDate = newPeriodEnd;
    await this.subscriberRepo.save(subscriber);
  }

  async update(
    merchantId: string,
    id: string,
    dto: UpdateSubscriberDto,
  ): Promise<Subscriber> {
    const subscriber = await this.findOne(merchantId, id);
    Object.assign(subscriber, dto);
    return this.subscriberRepo.save(subscriber);
  }

  async remove(merchantId: string, id: string): Promise<void> {
    const subscriber = await this.findOne(merchantId, id);

    // Expire virtual account on Nomba if it exists
    if (subscriber.virtualAccountId || subscriber.virtualAccountNumber) {
      try {
        await this.nombaService.expireVirtualAccount(
          (subscriber.virtualAccountId || subscriber.virtualAccountNumber)!,
        );
      } catch (err) {
        const error = err as Error;
        console.error(
          `Failed to expire Nomba virtual account for subscriber ${id}:`,
          error.message,
        );
      }
    }

    await this.subscriberRepo.remove(subscriber);
  }

  async bulkCreate(
    merchantId: string,
    dtoList: CreateSubscriberDto[],
  ): Promise<{ successCount: number; errors: string[] }> {
    const merchant = await this.merchantRepo.findOne({ where: { id: merchantId } });
    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    const errors: string[] = [];
    const subscribersToSave: Subscriber[] = [];
    let actualCount = await this.subscriberRepo.count({ where: { merchantId } });

    for (const dto of dtoList) {
      // Validate plan limits
      if (merchant.maxSubscribers !== -1 && (actualCount + subscribersToSave.length) >= merchant.maxSubscribers) {
        errors.push(`Could not add '${dto.email}': Subscriber limit of ${merchant.maxSubscribers} reached for your plan.`);
        continue;
      }

      const existing = await this.subscriberRepo.findOne({
        where: { merchantId, emailHash: hashEmail(dto.email.toLowerCase().trim()) },
      });
      if (existing) {
        errors.push(`Subscriber with email '${dto.email}' already registered.`);
        continue;
      }

      const inviteToken = randomBytes(32).toString('hex');
      const inviteExpiry = new Date();
      inviteExpiry.setHours(inviteExpiry.getHours() + 72);

      const subscriber = this.subscriberRepo.create({
        ...dto,
        merchantId,
        status: SubscriptionStatus.ACTIVE,
        portalInviteToken: inviteToken,
        portalInviteExpires: inviteExpiry,
      });

      subscribersToSave.push(subscriber);
    }

    if (subscribersToSave.length === 0) {
      return { successCount: 0, errors };
    }

    const savedSubscribers = await this.subscriberRepo.save(subscribersToSave);

    // Process Nomba VA creation asynchronously in the background
    this.processBulkBackgroundOnboarding(merchantId, savedSubscribers);

    return {
      successCount: savedSubscribers.length,
      errors,
    };
  }

  private async processBulkBackgroundOnboarding(
    merchantId: string,
    subscribers: Subscriber[],
  ): Promise<void> {
    for (const sub of subscribers) {
      // Generate VA
      try {
        const updated = await this.generateVirtualAccount(merchantId, sub.id);
        sub.virtualAccountNumber = updated.virtualAccountNumber;
        sub.virtualAccountBank = updated.virtualAccountBank;
        sub.virtualAccountId = updated.virtualAccountId;
      } catch (err) {
        console.error(
          `Background VA generation failed for subscriber ${sub.id}:`,
          (err as Error).message,
        );
      }

      // Wait 500ms between calls to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  async bulkSubscribe(
    merchantId: string,
    subscriberIds: string[],
    planId: string,
  ): Promise<{ successCount: number; errors: string[] }> {
    const plan = await this.plansService.findOne(merchantId, planId);
    if (!plan.isActive) {
      throw new BadRequestException('Selected billing plan is not active.');
    }

    // Fetch merchant business name dynamically
    let merchantName = 'Your Provider';
    try {
      const merchant = await this.merchantRepo.findOne({ where: { id: merchantId } });
      if (merchant) {
        merchantName = merchant.businessName;
      }
    } catch (err) {
      console.error(`Failed to fetch merchant for bulk onboarding:`, (err as Error).message);
    }

    const errors: string[] = [];
    const subscriptionsToSave: Subscription[] = [];
    const subscribersToUpdate: Subscriber[] = [];

    const startDate = new Date();
    const currentPeriodStart = new Date(startDate);
    const currentPeriodEnd = this.calculateNextBillingDate(
      startDate,
      plan.frequency,
      plan.customDays,
    );

    for (const subId of subscriberIds) {
      try {
        const subscriber = await this.findOne(merchantId, subId);

        // Check if subscriber already has an active subscription
        const activeSub = subscriber.subscriptions?.find((s) =>
          [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL].includes(s.status),
        );
        if (activeSub) {
          errors.push(`Subscriber ${subscriber.email} already has an active subscription.`);
          continue;
        }

        const subscription = this.subscriptionRepo.create({
          merchantId,
          subscriberId: subId,
          planId: plan.id,
          status: SubscriptionStatus.ACTIVE,
          planAmount: plan.amount,
          discountAmount: 0,
          finalAmount: plan.amount,
          startDate,
          currentPeriodStart,
          currentPeriodEnd,
        });

        subscriptionsToSave.push(subscription);

        subscriber.status = SubscriptionStatus.ACTIVE;
        subscriber.nextBillingDate = currentPeriodEnd;
        subscriber.lastBillingDate = currentPeriodStart;

        // Trigger onboarding email if subscriber hasn't completed portal setup yet
        if (!subscriber.portalPasswordHash) {
          let inviteToken = subscriber.portalInviteToken;
          if (!inviteToken || !subscriber.portalInviteExpires || subscriber.portalInviteExpires < new Date()) {
            inviteToken = randomBytes(32).toString('hex');
            const inviteExpiry = new Date();
            inviteExpiry.setHours(inviteExpiry.getHours() + 72);
            subscriber.portalInviteToken = inviteToken;
            subscriber.portalInviteExpires = inviteExpiry;
          }

          const setupUrl = `${process.env.FRONTEND_URL}/setup?token=${inviteToken}&merchant=${merchantId}`;
          const formattedAmount = new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: plan.currency || 'NGN',
          }).format(Number(plan.amount));

          this.emailService
            .sendSubscriberOnboardingEmail(
              subscriber.email,
              `${subscriber.firstName} ${subscriber.lastName}`,
              merchantName,
              plan.name,
              formattedAmount,
              plan.frequency.toLowerCase(),
              setupUrl,
              plan.trialDays,
            )
            .catch((err: unknown) => {
              console.error(
                `Failed to send bulk onboarding email for subscriber ${subscriber.id}:`,
                (err as Error).message,
              );
            });
        }

        subscribersToUpdate.push(subscriber);
      } catch (err) {
        errors.push(`Failed for subscriber ID ${subId}: ${(err as Error).message}`);
      }
    }

    if (subscriptionsToSave.length === 0) {
      return { successCount: 0, errors };
    }

    const savedSubscriptions = await this.subscriptionRepo.save(subscriptionsToSave);

    // Crucial: Associate saved subscription with each subscriber to avoid TypeORM relation deletion
    for (const savedSub of savedSubscriptions) {
      const subscriber = subscribersToUpdate.find(s => s.id === savedSub.subscriberId);
      if (subscriber) {
        if (!subscriber.subscriptions) {
          subscriber.subscriptions = [];
        }
        subscriber.subscriptions.push(savedSub);
      }
    }

    await this.subscriberRepo.save(subscribersToUpdate);

    // Process invoice creation in the background asynchronously
    this.processBulkInvoicesBackground(merchantId, savedSubscriptions, Number(plan.amount));

    return {
      successCount: savedSubscriptions.length,
      errors,
    };
  }

  private async processBulkInvoicesBackground(
    merchantId: string,
    subscriptions: Subscription[],
    amount: number,
  ): Promise<void> {
    for (const sub of subscriptions) {
      try {
        const subscriber = await this.subscriberRepo.findOne({
          where: { id: sub.subscriberId },
        });
        if (!subscriber) continue;

        await this.billingService.createSubscriptionInvoice(
          merchantId,
          sub.subscriberId,
          sub.id,
          amount,
          subscriber.paymentMethod,
          true,
        );
      } catch (err) {
        console.error(
          `Background invoice generation failed for subscription ${sub.id}:`,
          (err as Error).message,
        );
      }

      // Small delay of 100ms between database transactions to avoid locking issues
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}
