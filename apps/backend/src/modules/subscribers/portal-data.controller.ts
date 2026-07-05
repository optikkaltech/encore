import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  Response as Res,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import type { Response } from 'express';
import { PortalGuard } from './guards/portal.guard';
import { PortalPdfService } from './portal-pdf.service';
import { Invoice } from '../billing/entities/invoice.entity';
import { Transaction } from '../billing/entities/transaction.entity';
import { Subscriber } from './entities/subscriber.entity';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionStatus, PaymentMethod, PaymentStatus } from '../../shared/enums';
import { NombaService } from '../../core/nomba/nomba.service';
import { Public } from '../../common/decorators/security.decorators';
import { IsString, IsOptional, IsEnum } from 'class-validator';

class UpdatePaymentMethodDto {
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

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
}

/**
 * Subscriber portal data endpoints — all guarded by PortalGuard.
 * Subscribers access their own data only; no cross-subscriber access possible.
 */
@Controller('portal')
@Public() // TenantGuard bypass — PortalGuard handles subscriber auth
@UseGuards(PortalGuard)
export class PortalDataController {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Subscriber)
    private readonly subscriberRepo: Repository<Subscriber>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    private readonly pdfService: PortalPdfService,
    private readonly nombaService: NombaService,
  ) {}

  /** GET /portal/me — subscriber profile + active subscription summary */
  @Get('me')
  async getProfile(@Request() req: any) {
    const sub: Subscriber = req.user;
    const active = sub.subscriptions?.find(
      (s) =>
        s.status === SubscriptionStatus.ACTIVE ||
        s.status === SubscriptionStatus.TRIAL,
    );
    return {
      id: sub.id,
      firstName: sub.firstName,
      lastName: sub.lastName,
      email: sub.email,
      status: sub.status,
      paymentMethod: sub.paymentMethod,
      cardLastFour: sub.cardLastFour,
      cardExpiry: sub.cardExpiry,
      bankName: sub.bankName,
      nextBillingDate: sub.nextBillingDate,
      lastBillingDate: sub.lastBillingDate,
      activePlan: active
        ? {
            id: active.id,
            planName: active.plan?.name,
            amount: active.finalAmount,
            currency: 'NGN',
            frequency: active.plan?.frequency,
            status: active.status,
            currentPeriodEnd: active.currentPeriodEnd,
          }
        : null,
    };
  }

  /** GET /portal/invoices — paginated invoice list */
  @Get('invoices')
  async getInvoices(@Request() req: any) {
    const sub: Subscriber = req.user;
    const invoices = await this.invoiceRepo.find({
      where: { subscriberId: sub.id },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      totalAmount: inv.totalAmount,
      currency: inv.currency,
      status: inv.status,
      paidAt: inv.paidAt,
      createdAt: inv.createdAt,
    }));
  }

  /** GET /portal/invoices/:id/download — stream PDF */
  @Get('invoices/:id/download')
  @UseGuards(PortalGuard)
  async downloadInvoice(
    @Param('id') id: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    await this.pdfService.streamInvoicePdf(id, req.user, res);
  }

  /** GET /portal/payments — transaction history */
  @Get('payments')
  async getPayments(@Request() req: any) {
    const sub: Subscriber = req.user;
    const txns = await this.transactionRepo.find({
      where: { subscriberId: sub.id },
      order: { createdAt: 'DESC' },
      take: 100,
    });
    return txns.map((t) => ({
      id: t.id,
      amount: t.amount,
      currency: t.currency,
      status: t.status,
      paymentMethod: t.paymentMethod,
      type: t.type,
      invoiceNumber: t.invoiceNumber,
      processedAt: t.processedAt,
      createdAt: t.createdAt,
    }));
  }

  /** PATCH /portal/payment-method — update card or mandate */
  @Patch('payment-method')
  @HttpCode(HttpStatus.OK)
  async updatePaymentMethod(
    @Request() req: any,
    @Body() dto: UpdatePaymentMethodDto,
  ) {
    const sub: Subscriber = req.user;
    const subscriber = await this.subscriberRepo.findOne({
      where: { id: sub.id },
    });
    if (!subscriber) return { message: 'Subscriber not found' };

    subscriber.paymentMethod = dto.paymentMethod;
    if (dto.cardToken) subscriber.cardToken = dto.cardToken;
    if (dto.cardLastFour) subscriber.cardLastFour = dto.cardLastFour;
    if (dto.cardExpiry) subscriber.cardExpiry = dto.cardExpiry;
    if (dto.mandateId) subscriber.mandateId = dto.mandateId;

    await this.subscriberRepo.save(subscriber);
    return { message: 'Payment method updated successfully' };
  }

  /** POST /portal/subscription/pause — subscriber self-pauses */
  @Post('subscription/pause')
  @HttpCode(HttpStatus.OK)
  async pauseSubscription(@Request() req: any) {
    const sub: Subscriber = req.user;
    const active = await this.subscriptionRepo.findOne({
      where: {
        subscriberId: sub.id,
        status: In([
          SubscriptionStatus.ACTIVE,
          SubscriptionStatus.TRIAL,
          SubscriptionStatus.PAST_DUE,
        ]),
      },
    });
    if (!active) return { message: 'No active subscription to pause' };

    active.status = SubscriptionStatus.PAUSED;
    active.pausedAt = new Date();
    await this.subscriptionRepo.save(active);

    await this.subscriberRepo.update(sub.id, {
      status: SubscriptionStatus.PAUSED,
    });
    return { message: 'Subscription paused successfully' };
  }

  /** POST /portal/subscription/cancel — subscriber self-cancels */
  @Post('subscription/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelSubscription(@Request() req: any) {
    const sub: Subscriber = req.user;
    const active = await this.subscriptionRepo.findOne({
      where: {
        subscriberId: sub.id,
        status: In([
          SubscriptionStatus.ACTIVE,
          SubscriptionStatus.TRIAL,
          SubscriptionStatus.PAST_DUE,
          SubscriptionStatus.PAUSED,
        ]),
      },
    });
    if (!active) return { message: 'No active subscription to cancel' };

    active.status = SubscriptionStatus.CANCELLED;
    active.cancelledAt = new Date();
    await this.subscriptionRepo.save(active);

    await this.subscriberRepo.update(sub.id, {
      status: SubscriptionStatus.CANCELLED,
      nextBillingDate: null as any,
    });
    return {
      message:
        'Subscription cancelled. Access ends at the close of your current period.',
    };
  }

  /** POST /portal/payments/:id/pay — manually charge pending transaction using card/mandate */
  @Post('payments/:id/pay')
  @HttpCode(HttpStatus.OK)
  async payPendingTransaction(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const sub: Subscriber = req.user;
    
    // Find transaction
    const transaction = await this.transactionRepo.findOne({
      where: { id, subscriberId: sub.id },
    });
    
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    
    if (transaction.status === PaymentStatus.SUCCESS) {
      throw new BadRequestException('Transaction is already successfully paid');
    }

    // Get the latest subscriber details to have access to payment token / mandate
    const subscriber = await this.subscriberRepo.findOne({
      where: { id: sub.id },
    });

    if (!subscriber) {
      throw new NotFoundException('Subscriber not found');
    }

    const reference = `pay_retry_${transaction.id}_${Date.now()}`;
    let paymentSuccess = false;
    let nombaRef = '';

    try {
      if (
        subscriber.paymentMethod === PaymentMethod.CARD &&
        subscriber.cardToken
      ) {
        const res = await this.nombaService.chargeTokenizedCard(
          subscriber.cardToken,
          Number(transaction.amount),
          reference,
        );
        paymentSuccess = res.status === 'SUCCESS' || res.status === 'SUCCESSFUL' || res.status === 'APPROVED';
        nombaRef = res.nombaReference || '';
      } else if (
        subscriber.paymentMethod === PaymentMethod.DIRECT_DEBIT &&
        subscriber.mandateId
      ) {
        const res = await this.nombaService.chargeDirectDebit(
          subscriber.mandateId,
          Number(transaction.amount),
          reference,
        );
        paymentSuccess = res.status === 'SUCCESS' || res.status === 'SUCCESSFUL' || res.status === 'APPROVED';
        nombaRef = res.nombaReference || '';
      } else {
        throw new BadRequestException(
          'No saved payment method (tokenized card or direct debit mandate) found. Please update your payment method.'
        );
      }
    } catch (err: any) {
      throw new BadRequestException(`Payment failed: ${err.message}`);
    }

    if (paymentSuccess) {
      // Update transaction status
      transaction.status = PaymentStatus.SUCCESS;
      transaction.processedAt = new Date();
      transaction.nombaReference = nombaRef;
      await this.transactionRepo.save(transaction);

      // Update associated invoice if present
      if (transaction.invoiceId) {
        const invoice = await this.invoiceRepo.findOne({
          where: { id: transaction.invoiceId },
        });
        if (invoice) {
          invoice.status = 'paid';
          invoice.paidAt = new Date();
          await this.invoiceRepo.save(invoice);
        }
      }
      
      // Mark the subscriber active if they were in failed/dunning status
      if (subscriber.status !== 'active') {
        subscriber.status = 'active' as any;
        await this.subscriberRepo.save(subscriber);
      }

      return { success: true, message: 'Payment successfully processed' };
    } else {
      transaction.status = PaymentStatus.FAILED;
      transaction.failureMessage = 'Manual charge attempt failed.';
      await this.transactionRepo.save(transaction);
      throw new BadRequestException('Payment attempt failed. Please check your card or bank mandate.');
    }
  }
}
