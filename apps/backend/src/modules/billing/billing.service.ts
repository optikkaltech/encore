import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { Transaction } from './entities/transaction.entity';
import { CreateInvoiceDto } from './dto/invoice.dto';
import { SubscribersService } from '../subscribers/subscribers.service';
import { PaymentStatus, PaymentMethod, AccountType } from '../../shared/enums';
import { NombaService } from '../../core/nomba/nomba.service';
import { Subscription } from '../subscribers/entities/subscription.entity';
import { PortalPdfService } from '../subscribers/portal-pdf.service';
import { Response } from 'express';
import { MerchantsService } from '../merchants/merchants.service';
import { Merchant } from '../merchants/entities/merchant.entity';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @Inject(forwardRef(() => SubscribersService))
    private readonly subscribersService: SubscribersService,
    @Inject(forwardRef(() => NombaService))
    private readonly nombaService: NombaService,
    @Inject(forwardRef(() => PortalPdfService))
    private readonly pdfService: PortalPdfService,
    @Inject(forwardRef(() => MerchantsService))
    private readonly merchantsService: MerchantsService,
  ) {}

  async streamInvoicePdf(
    invoiceId: string,
    merchantId: string,
    res: Response,
  ): Promise<void> {
    await this.pdfService.streamInvoicePdfForMerchant(invoiceId, merchantId, res);
  }

  async createInvoice(
    merchantId: string,
    dto: CreateInvoiceDto,
  ): Promise<Invoice> {
    const subscriber = await this.subscribersService.findOne(
      merchantId,
      dto.subscriberId,
    );

    // Calculate line item totals
    const lineItems = dto.lineItems.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.quantity * item.unitPrice,
      type: 'subscription' as const, // standard manual line item mapping
    }));

    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const totalAmount = subtotal; // No taxes/discounts on manual invoices for simplicity
    await this.enforceTransactionLimits(merchantId, totalAmount);
    const currency = dto.currency || 'NGN';
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    // Get active subscription ID to satisfy transaction constraints, or fallback if none
    const subscriptionId =
      subscriber.subscriptions?.[0]?.id ||
      '00000000-0000-0000-0000-000000000000';

    // 1. Create corresponding Transaction
    const transaction = this.transactionRepo.create({
      merchantId,
      subscriberId: subscriber.id,
      subscriptionId,
      type: 'one_time',
      amount: totalAmount,
      currency,
      status: PaymentStatus.SUCCESS,
      paymentMethod: PaymentMethod.CARD,
      nombaReference: `ref_man_${Date.now()}`,
      processedAt: new Date(),
    });

    const savedTransaction = await this.transactionRepo.save(transaction);

    // 2. Create Invoice
    const invoice = this.invoiceRepo.create({
      merchantId,
      invoiceNumber,
      subscriberId: subscriber.id,
      customerEmail: subscriber.email,
      customerName: `${subscriber.firstName} ${subscriber.lastName}`,
      lineItems,
      subtotal,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount,
      currency,
      transactionId: savedTransaction.id,
      paidAt: new Date(),
      paymentMethod: 'card',
      status: 'paid',
      notes: dto.notes,
    });

    const savedInvoice = await this.invoiceRepo.save(invoice);

    // 3. Link invoiceId back to transaction
    savedTransaction.invoiceId = savedInvoice.id;
    savedTransaction.invoiceNumber = savedInvoice.invoiceNumber;
    await this.transactionRepo.save(savedTransaction);

    return savedInvoice;
  }

  async findAllInvoices(merchantId: string): Promise<Invoice[]> {
    return this.invoiceRepo.find({
      where: { merchantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findAllTransactions(merchantId: string): Promise<Transaction[]> {
    return this.transactionRepo.find({
      where: { merchantId },
      relations: { subscriber: true },
      order: { createdAt: 'DESC' },
    });
  }

  async createSubscriptionInvoice(
    merchantId: string,
    subscriberId: string,
    subscriptionId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    isInitial = false,
  ): Promise<Invoice> {
    await this.enforceTransactionLimits(merchantId, amount);
    const subscriber = await this.subscribersService.findOne(
      merchantId,
      subscriberId,
    );

    const subscription = await this.invoiceRepo.manager.getRepository(Subscription).findOne({
      where: { id: subscriptionId },
      relations: { plan: true },
    });

    const plan = subscription?.plan;
    const hasTrial = isInitial && plan && plan.trialDays > 0;
    const setupFee = isInitial && plan ? Number(plan.setupFee) || 0 : 0;
    
    const subCharge = hasTrial ? 0 : amount;
    const totalAmount = subCharge + setupFee;

    const lineItems: any[] = [];
    if (setupFee > 0) {
      lineItems.push({
        description: `${plan?.name || 'Subscription'} - Setup Fee`,
        quantity: 1,
        unitPrice: setupFee,
        amount: setupFee,
        type: 'setup_fee',
      });
    }

    lineItems.push({
      description: hasTrial
        ? `${plan?.name || 'Subscription'} - Trial Period (${plan?.trialDays} Days)`
        : isInitial
        ? `${plan?.name || 'Subscription'} - Initial Period`
        : `${plan?.name || 'Subscription'} - Renewal Charge`,
      quantity: 1,
      unitPrice: subCharge,
      amount: subCharge,
      type: 'subscription',
    });

    const currency = plan?.currency || 'NGN';
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    let isPaid = totalAmount === 0;
    let paymentSuccess = isPaid;
    let nombaRef = isPaid ? `ref_trial_${Date.now()}` : `ref_pending_${Date.now()}`;
    let processedAt: Date | null = isPaid ? new Date() : null;

    if (totalAmount > 0) {
      if (paymentMethod === PaymentMethod.CARD && subscriber.cardToken) {
        try {
          const res = await this.nombaService.chargeTokenizedCard(
            subscriber.cardToken,
            totalAmount,
            `ref_init_${invoiceNumber}`,
          );
          paymentSuccess = res.status === 'SUCCESS';
          nombaRef = res.nombaReference;
          if (paymentSuccess) {
            isPaid = true;
            processedAt = new Date();
          }
        } catch (err) {
          console.error(`Automatic card charge failed for initial invoice:`, (err as Error).message);
        }
      } else if (paymentMethod === PaymentMethod.DIRECT_DEBIT && subscriber.mandateId) {
        try {
          const res = await this.nombaService.chargeDirectDebit(
            subscriber.mandateId,
            totalAmount,
            `ref_init_${invoiceNumber}`,
          );
          paymentSuccess = res.status === 'SUCCESS';
          nombaRef = res.nombaReference;
          if (paymentSuccess) {
            isPaid = true;
            processedAt = new Date();
          }
        } catch (err) {
          console.error(`Automatic direct debit charge failed for initial invoice:`, (err as Error).message);
        }
      }
    }

    // 1. Create Transaction
    const transaction = this.transactionRepo.create({
      merchantId,
      subscriberId,
      subscriptionId,
      type: 'subscription',
      amount: totalAmount,
      currency,
      status: paymentSuccess 
        ? PaymentStatus.SUCCESS 
        : (totalAmount > 0 && (subscriber.cardToken || subscriber.mandateId) 
          ? PaymentStatus.FAILED 
          : PaymentStatus.PENDING),
      paymentMethod,
      nombaReference: nombaRef,
      processedAt,
    });

    const savedTransaction = await this.transactionRepo.save(transaction);

    // 2. Create Invoice
    const invoice = this.invoiceRepo.create({
      merchantId,
      invoiceNumber,
      subscriberId,
      customerEmail: subscriber.email,
      customerName: `${subscriber.firstName} ${subscriber.lastName}`,
      lineItems,
      subtotal: totalAmount,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount,
      currency,
      transactionId: savedTransaction.id,
      paidAt: isPaid ? new Date() : null,
      paymentMethod:
        paymentMethod === PaymentMethod.VIRTUAL_ACCOUNT
          ? 'bank_transfer'
          : 'card',
      status: isPaid ? 'paid' : 'sent',
    });

    const savedInvoice = await this.invoiceRepo.save(invoice);

    // 3. Link invoiceId back to transaction
    savedTransaction.invoiceId = savedInvoice.id;
    savedTransaction.invoiceNumber = savedInvoice.invoiceNumber;
    await this.transactionRepo.save(savedTransaction);

    return savedInvoice;
  }

  private async enforceTransactionLimits(merchantId: string, amount: number): Promise<void> {
    const merchant = await this.invoiceRepo.manager.getRepository(Merchant).findOne({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    // 1. Block real external payments for demo accounts
    if (merchant.accountType === AccountType.DEMO) {
      throw new BadRequestException('Demo accounts cannot process real card or bank payments.');
    }

    // 2. Fetch merchant configuration
    const config = await this.merchantsService.getMerchantConfig(merchantId);

    // Check single transaction limit
    if (config.limits.maxTransactionAmount !== -1 && amount > config.limits.maxTransactionAmount) {
      throw new BadRequestException(
        `Transaction of ₦${amount} exceeds the single transaction limit of ₦${config.limits.maxTransactionAmount} set for unverified accounts. Please complete KYC under Settings to remove this limit.`,
      );
    }

    // Check monthly volume limit
    const projectedVolume = config.usage.currentMonthlyVolume + amount;
    if (config.limits.maxMonthlyVolume !== -1 && projectedVolume > config.limits.maxMonthlyVolume) {
      throw new BadRequestException(
        `Transaction of ₦${amount} exceeds your remaining monthly volume limit of ₦${Math.max(0, config.limits.maxMonthlyVolume - config.usage.currentMonthlyVolume)}. Please complete KYC under Settings to remove this limit.`,
      );
    }
  }
}

