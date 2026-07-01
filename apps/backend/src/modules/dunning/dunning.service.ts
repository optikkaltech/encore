import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, LessThanOrEqual } from 'typeorm';
import { Dunning } from './entities/dunning.entity';
import { Subscriber } from '../subscribers/entities/subscriber.entity';
import { Subscription } from '../subscribers/entities/subscription.entity';
import { Invoice } from '../billing/entities/invoice.entity';
import { NombaService } from '../../core/nomba/nomba.service';
import { EmailService } from '../../core/email/email.service';
import { BillingService } from '../billing/billing.service';
import {
  DunningStatus,
  SubscriptionStatus,
  PaymentMethod,
  BillingFrequency,
  PaymentStatus,
} from '../../shared/enums';
import { ConfigService } from '@nestjs/config';
import { Plan } from '../plans/entities/plan.entity';
import { Transaction } from '../billing/entities/transaction.entity';

@Injectable()
export class DunningService {
  private readonly logger = new Logger(DunningService.name);

  constructor(
    @InjectRepository(Dunning)
    private readonly dunningRepo: Repository<Dunning>,
    @InjectRepository(Subscriber)
    private readonly subscriberRepo: Repository<Subscriber>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    private readonly nombaService: NombaService,
    private readonly emailService: EmailService,
    private readonly billingService: BillingService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Find dunning logs for a merchant
   */
  async findAll(merchantId: string): Promise<Dunning[]> {
    return this.dunningRepo.find({
      where: { merchantId },
      relations: { subscriber: true, invoice: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Initiate dunning process when a payment fails
   */
  async startDunning(
    merchantId: string,
    subscriberId: string,
    subscriptionId: string,
    invoiceId: string,
    amount: number,
  ): Promise<Dunning> {
    const existing = await this.dunningRepo.findOne({
      where: { invoiceId, status: DunningStatus.IN_PROGRESS },
    });

    if (existing) {
      return existing;
    }

    const subscriber = await this.subscriberRepo.findOne({
      where: { id: subscriberId, merchantId, deletedAt: IsNull() },
    });
    if (!subscriber) {
      throw new NotFoundException(
        `Subscriber with ID ${subscriberId} not found.`,
      );
    }

    // Configure first retry interval (1 minute for demo/sandbox testing, or 3 days for production)
    const isSandbox = !this.config.get('nomba.clientId');
    const retryIntervalMs = isSandbox ? 60 * 1000 : 3 * 24 * 60 * 60 * 1000;
    const nextAttemptAt = new Date(Date.now() + retryIntervalMs);

    const dunning = this.dunningRepo.create({
      merchantId,
      subscriberId,
      subscriptionId,
      invoiceId,
      amount,
      status: DunningStatus.IN_PROGRESS,
      attemptCount: 0,
      nextAttemptAt,
      timeline: [
        {
          timestamp: new Date().toISOString(),
          action: 'DUNNING_STARTED',
          description: `Dunning flow started. Scheduled retry on: ${nextAttemptAt.toLocaleString()}`,
        },
      ],
    });

    const saved = await this.dunningRepo.save(dunning);

    // Send Day 0 Email Alert (asynchronous, non-blocking)
    const clientUrl =
      this.config.get<string>('CLIENT_URL') || 'http://localhost:5173';
    const updatePaymentUrl = `${clientUrl}/portal/update-payment?subscriberId=${subscriberId}`;

    this.emailService
      .sendDunningEmail(
        subscriber.email,
        `${subscriber.firstName} ${subscriber.lastName}`,
        invoiceId.substring(0, 8),
        `₦${amount.toLocaleString()}`,
        1,
        nextAttemptAt.toLocaleDateString(),
        updatePaymentUrl,
      )
      .then(() => {
        saved.timeline.push({
          timestamp: new Date().toISOString(),
          action: 'DAY_0_EMAIL_SENT',
          description: `Initial payment failure notification sent to customer email.`,
          attempt: 0,
        });
        this.dunningRepo.save(saved);
      })
      .catch((err) =>
        this.logger.error(`Failed to send Day 0 dunning email: ${err.message}`),
      );

    return saved;
  }

  /**
   * Execute scheduled payment retries (usually triggered by a cron job)
   */
  async executeDunningRetries(): Promise<{
    processedCount: number;
    recoveredCount: number;
  }> {
    const now = new Date();
    const pendingLogs = await this.dunningRepo.find({
      where: {
        status: DunningStatus.IN_PROGRESS,
        nextAttemptAt: LessThanOrEqual(now),
      },
      relations: {
        subscriber: true,
        subscription: { plan: true },
        invoice: true,
      },
    });

    let processedCount = 0;
    let recoveredCount = 0;

    for (const log of pendingLogs) {
      processedCount++;
      const subscriber = log.subscriber;
      const subscription = log.subscription;

      if (!subscriber || !subscription) {
        log.status = DunningStatus.FAILED;
        log.timeline.push({
          timestamp: new Date().toISOString(),
          action: 'DUNNING_ABORTED',
          description: 'Subscriber or subscription reference missing.',
        });
        await this.dunningRepo.save(log);
        continue;
      }

      log.attemptCount += 1;
      log.lastAttemptAt = new Date();

      const attemptRef = `ref_retry_${log.id}_${log.attemptCount}`;
      log.timeline.push({
        timestamp: new Date().toISOString(),
        action: 'CHARGE_ATTEMPT',
        description: `Triggered payment retry attempt #${log.attemptCount} (Ref: ${attemptRef})`,
        attempt: log.attemptCount,
      });

      let paymentSuccess = false;
      let txRef = '';

      try {
        if (
          subscriber.paymentMethod === PaymentMethod.CARD &&
          subscriber.cardToken
        ) {
          const res = await this.nombaService.chargeTokenizedCard(
            subscriber.cardToken,
            Number(log.amount),
            attemptRef,
          );
          paymentSuccess = res.status === 'SUCCESS';
          txRef = res.nombaReference;
        } else if (
          subscriber.paymentMethod === PaymentMethod.DIRECT_DEBIT &&
          subscriber.mandateId
        ) {
          const res = await this.nombaService.chargeDirectDebit(
            subscriber.mandateId,
            Number(log.amount),
            attemptRef,
          );
          paymentSuccess = res.status === 'SUCCESS';
          txRef = res.nombaReference;
        } else {
          // Default fallback mock charge outcome
          const res = await this.nombaService.chargeTokenizedCard(
            'mock_token',
            Number(log.amount),
            attemptRef,
          );
          paymentSuccess = res.status === 'SUCCESS';
          txRef = res.nombaReference;
        }
      } catch (err: any) {
        this.logger.error(
          `Nomba charge call failed during dunning: ${err.message}`,
        );
      }

      if (paymentSuccess) {
        // SUCCESS recovery flow
        recoveredCount++;
        log.status = DunningStatus.RECOVERED;
        log.timeline.push({
          timestamp: new Date().toISOString(),
          action: 'DUNNING_RECOVERED',
          description: `Payment successful on attempt #${log.attemptCount}. Nomba TxRef: ${txRef}`,
          attempt: log.attemptCount,
        });

        // 1. Update invoice to Paid
        const invoice = log.invoice;
        if (invoice) {
          invoice.status = 'paid';
          invoice.paidAt = new Date();
          await this.invoiceRepo.save(invoice);
        }

        // 2. Set subscription & subscriber active, advance billing dates
        subscription.status = SubscriptionStatus.ACTIVE;
        const nextDate = new Date();
        nextDate.setMonth(nextDate.getMonth() + 1); // standard rollover
        subscription.currentPeriodStart = new Date();
        subscription.currentPeriodEnd = nextDate;
        await this.subscriptionRepo.save(subscription);

        subscriber.status = SubscriptionStatus.ACTIVE;
        subscriber.consecutiveFailures = 0;
        subscriber.lastBillingDate = new Date();
        subscriber.nextBillingDate = nextDate;
        await this.subscriberRepo.save(subscriber);

        // 3. Send email receipt
        this.emailService
          .sendPaymentReceiptEmail(
            subscriber.email,
            `${subscriber.firstName} ${subscriber.lastName}`,
            invoice?.invoiceNumber || log.invoiceId.substring(0, 8),
            `₦${log.amount.toLocaleString()}`,
            new Date().toLocaleDateString(),
            subscriber.paymentMethod.replace('_', ' '),
            subscription.plan?.name || 'Subscription Tier',
          )
          .catch((err) =>
            this.logger.error(
              `Failed to send recovery payment receipt: ${err.message}`,
            ),
          );
      } else {
        // FAILURE recovery retry flow
        log.timeline.push({
          timestamp: new Date().toISOString(),
          action: 'CHARGE_FAILED',
          description: `Payment attempt #${log.attemptCount} declined or failed.`,
          attempt: log.attemptCount,
        });

        const isSandbox = !this.config.get('nomba.clientId');

        if (log.attemptCount === 1) {
          // Retry in 2 days (or 1 minute sandbox)
          const nextInterval = isSandbox ? 60 * 1000 : 2 * 24 * 60 * 60 * 1000;
          log.nextAttemptAt = new Date(Date.now() + nextInterval);
          log.timeline.push({
            timestamp: new Date().toISOString(),
            action: 'SCHEDULED_NEXT_RETRY',
            description: `Scheduled retry attempt #2 for: ${log.nextAttemptAt.toLocaleString()}`,
          });

          // Send Day 3 notification email
          const clientUrl =
            this.config.get<string>('CLIENT_URL') || 'http://localhost:5173';
          this.emailService
            .sendDunningEmail(
              subscriber.email,
              `${subscriber.firstName} ${subscriber.lastName}`,
              log.invoiceId.substring(0, 8),
              `₦${log.amount.toLocaleString()}`,
              2,
              log.nextAttemptAt.toLocaleDateString(),
              `${clientUrl}/portal/update-payment?subscriberId=${subscriber.id}`,
            )
            .catch((err) =>
              this.logger.error(
                `Failed to send Day 3 dunning email: ${err.message}`,
              ),
            );
        } else if (log.attemptCount === 2) {
          // Retry in 2 days (or 1 minute sandbox)
          const nextInterval = isSandbox ? 60 * 1000 : 2 * 24 * 60 * 60 * 1000;
          log.nextAttemptAt = new Date(Date.now() + nextInterval);
          log.timeline.push({
            timestamp: new Date().toISOString(),
            action: 'SCHEDULED_NEXT_RETRY',
            description: `Scheduled retry attempt #3 for: ${log.nextAttemptAt.toLocaleString()}`,
          });

          // Send Day 5 urgency email
          const clientUrl =
            this.config.get<string>('CLIENT_URL') || 'http://localhost:5173';
          this.emailService
            .sendDunningEmail(
              subscriber.email,
              `${subscriber.firstName} ${subscriber.lastName}`,
              log.invoiceId.substring(0, 8),
              `₦${log.amount.toLocaleString()}`,
              3,
              log.nextAttemptAt.toLocaleDateString(),
              `${clientUrl}/portal/update-payment?subscriberId=${subscriber.id}`,
            )
            .catch((err) =>
              this.logger.error(
                `Failed to send Day 5 dunning email: ${err.message}`,
              ),
            );
        } else {
          // Day 7: Suspend customer access
          log.status = DunningStatus.FAILED;
          log.nextAttemptAt = null as any;
          log.timeline.push({
            timestamp: new Date().toISOString(),
            action: 'DUNNING_FAILED_SUSPENDED',
            description: `Recovery failed after ${log.attemptCount} retries. Customer access suspended.`,
          });

          subscriber.status = SubscriptionStatus.PAST_DUE;
          subscriber.nextBillingDate = null as any;
          await this.subscriberRepo.save(subscriber);

          subscription.status = SubscriptionStatus.PAST_DUE;
          await this.subscriptionRepo.save(subscription);

          this.logger.warn(
            `Dunning failed for subscriber ${subscriber.id}. Account suspended.`,
          );
        }
      }

      await this.dunningRepo.save(log);
    }

    return { processedCount, recoveredCount };
  }

  /**
   * Execute manual retry on a specific dunning case
   */
  async manualRetry(merchantId: string, dunningId: string): Promise<Dunning> {
    const log = await this.dunningRepo.findOne({
      where: { id: dunningId, merchantId },
      relations: {
        subscriber: true,
        subscription: { plan: true },
        invoice: true,
      },
    });

    if (!log) {
      throw new NotFoundException(
        `Dunning case with ID ${dunningId} not found.`,
      );
    }

    if (log.status !== DunningStatus.IN_PROGRESS) {
      throw new BadRequestException(
        `Cannot retry dunning case with status ${log.status}.`,
      );
    }

    log.attemptCount += 1;
    log.lastAttemptAt = new Date();

    const attemptRef = `ref_manual_retry_${log.id}_${log.attemptCount}`;
    log.timeline.push({
      timestamp: new Date().toISOString(),
      action: 'MANUAL_RETRY_TRIGGERED',
      description: `Merchant manually triggered payment retry (Ref: ${attemptRef})`,
    });

    const subscriber = log.subscriber;
    const subscription = log.subscription;

    let paymentSuccess = false;
    let txRef = '';

    try {
      if (
        subscriber.paymentMethod === PaymentMethod.CARD &&
        subscriber.cardToken
      ) {
        const res = await this.nombaService.chargeTokenizedCard(
          subscriber.cardToken,
          Number(log.amount),
          attemptRef,
        );
        paymentSuccess = res.status === 'SUCCESS';
        txRef = res.nombaReference;
      } else if (
        subscriber.paymentMethod === PaymentMethod.DIRECT_DEBIT &&
        subscriber.mandateId
      ) {
        const res = await this.nombaService.chargeDirectDebit(
          subscriber.mandateId,
          Number(log.amount),
          attemptRef,
        );
        paymentSuccess = res.status === 'SUCCESS';
        txRef = res.nombaReference;
      } else {
        const res = await this.nombaService.chargeTokenizedCard(
          'mock_token',
          Number(log.amount),
          attemptRef,
        );
        paymentSuccess = res.status === 'SUCCESS';
        txRef = res.nombaReference;
      }
    } catch (err: any) {
      this.logger.error(
        `Nomba charge call failed during manual dunning: ${err.message}`,
      );
    }

    if (paymentSuccess) {
      log.status = DunningStatus.RECOVERED;
      log.timeline.push({
        timestamp: new Date().toISOString(),
        action: 'DUNNING_RECOVERED_MANUALLY',
        description: `Payment successful. Nomba TxRef: ${txRef}`,
      });

      const invoice = log.invoice;
      if (invoice) {
        invoice.status = 'paid';
        invoice.paidAt = new Date();
        await this.invoiceRepo.save(invoice);
      }

      subscription.status = SubscriptionStatus.ACTIVE;
      const nextDate = new Date();
      nextDate.setMonth(nextDate.getMonth() + 1);
      subscription.currentPeriodStart = new Date();
      subscription.currentPeriodEnd = nextDate;
      await this.subscriptionRepo.save(subscription);

      subscriber.status = SubscriptionStatus.ACTIVE;
      subscriber.consecutiveFailures = 0;
      subscriber.lastBillingDate = new Date();
      subscriber.nextBillingDate = nextDate;
      await this.subscriberRepo.save(subscriber);
    } else {
      log.timeline.push({
        timestamp: new Date().toISOString(),
        action: 'MANUAL_RETRY_FAILED',
        description: `Manual retry attempt failed. Status remains in progress.`,
      });
    }

    return this.dunningRepo.save(log);
  }

  /**
   * Cancel dunning case and suspend subscription
   */
  async cancelDunning(merchantId: string, dunningId: string): Promise<Dunning> {
    const log = await this.dunningRepo.findOne({
      where: { id: dunningId, merchantId },
      relations: { subscriber: true, subscription: true },
    });

    if (!log) {
      throw new NotFoundException(
        `Dunning case with ID ${dunningId} not found.`,
      );
    }

    if (log.status !== DunningStatus.IN_PROGRESS) {
      throw new BadRequestException(
        `Cannot cancel dunning case with status ${log.status}.`,
      );
    }

    log.status = DunningStatus.CANCELLED;
    log.nextAttemptAt = null as any;
    log.timeline.push({
      timestamp: new Date().toISOString(),
      action: 'DUNNING_CANCELLED_MANUALLY',
      description: `Merchant manually cancelled recovery. Subscriber access suspended.`,
    });

    const subscriber = log.subscriber;
    const subscription = log.subscription;

    subscriber.status = SubscriptionStatus.PAST_DUE;
    subscriber.nextBillingDate = null as any;
    await this.subscriberRepo.save(subscriber);

    subscription.status = SubscriptionStatus.PAST_DUE;
    await this.subscriptionRepo.save(subscription);

    return this.dunningRepo.save(log);
  }

  /**
   * Helper to set up a test dunning case for local testing
   */
  async setupTestDunning(merchantId: string): Promise<Dunning> {
    // 1. Create a subscriber if none exists
    let subscriber = await this.subscriberRepo.findOne({
      where: { merchantId, email: 'test.dunning.sub@example.com' },
    });

    if (!subscriber) {
      subscriber = this.subscriberRepo.create({
        merchantId,
        email: 'test.dunning.sub@example.com',
        firstName: 'Dunning',
        lastName: 'TestUser',
        phone: '+2348031234567',
        paymentMethod: PaymentMethod.CARD,
        cardToken: 'tok_force_success',
        cardLastFour: '4321',
        cardExpiry: '12/28',
        status: SubscriptionStatus.ACTIVE,
      });
      subscriber = await this.subscriberRepo.save(subscriber);
    } else {
      subscriber.cardToken = 'tok_force_success';
      subscriber = await this.subscriberRepo.save(subscriber);
    }

    // 2. Find an active plan for this merchant
    const planRepo = this.subscriberRepo.manager.getRepository(Plan);
    let plan = await planRepo.findOne({
      where: { merchantId, isActive: true },
    });

    if (!plan) {
      plan = planRepo.create({
        merchantId,
        name: 'Standard Gym Plan',
        code: `gym_std_${Date.now().toString(36).substring(2, 6)}`,
        description: 'Standard gym plan description',
        amount: 5000.0,
        currency: 'NGN',
        frequency: BillingFrequency.MONTHLY,
        isActive: true,
      });
      plan = await planRepo.save(plan);
    }

    const planAmount = Number(plan.amount);

    // 3. Create active subscription for subscriber
    let subscription = await this.subscriptionRepo.findOne({
      where: { subscriberId: subscriber.id, planId: plan.id },
    });

    if (!subscription) {
      subscription = this.subscriptionRepo.create({
        merchantId,
        subscriberId: subscriber.id,
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        planAmount,
        discountAmount: 0,
        finalAmount: planAmount,
        startDate: new Date(),
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      subscription = await this.subscriptionRepo.save(subscription);
    }

    // Create a failed Transaction
    const transactionRepo =
      this.subscriberRepo.manager.getRepository(Transaction);
    const transaction = transactionRepo.create({
      merchantId,
      subscriberId: subscriber.id,
      subscriptionId: subscription.id,
      type: 'subscription',
      amount: planAmount,
      currency: 'NGN',
      status: PaymentStatus.FAILED,
      paymentMethod: PaymentMethod.CARD,
      nombaReference: `ref_fail_${Date.now()}`,
      failureCode: 'INSUFFICIENT_FUNDS',
      failureMessage: 'The card has insufficient funds.',
      processedAt: new Date(),
    });
    const savedTransaction = (await transactionRepo.save(transaction)) as any;

    // 4. Create an unpaid invoice
    const invoiceNumber = `INV-TEST-${Date.now()}`;
    const invoice = this.invoiceRepo.create({
      merchantId,
      invoiceNumber,
      subscriberId: subscriber.id,
      customerEmail: subscriber.email,
      customerName: `${subscriber.firstName} ${subscriber.lastName}`,
      lineItems: [
        {
          description: `Test payment failure invoice`,
          quantity: 1,
          unitPrice: planAmount,
          amount: planAmount,
          type: 'subscription',
        },
      ],
      subtotal: planAmount,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: planAmount,
      currency: 'NGN',
      status: 'sent',
      transactionId: savedTransaction.id,
      paidAt: new Date(),
      paymentMethod: 'card',
    });
    const savedInvoice = (await this.invoiceRepo.save(invoice)) as any;

    // 5. Start dunning
    return this.startDunning(
      merchantId,
      subscriber.id,
      subscription.id,
      savedInvoice.id,
      planAmount,
    );
  }

  /**
   * Find first merchant (for test setup helper)
   */
  async findFirstMerchantId(): Promise<string> {
    const res = await this.dunningRepo.manager.query(
      'SELECT id FROM merchants LIMIT 1',
    );
    if (!res || res.length === 0) {
      throw new NotFoundException(
        'No merchants found in database to set up test.',
      );
    }
    return res[0].id;
  }
}
