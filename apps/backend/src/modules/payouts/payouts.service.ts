import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Payout } from './entities/payout.entity';
import { MerchantLedger } from './entities/merchant-ledger.entity';
import { Transaction } from '../billing/entities/transaction.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { CreatePayoutDto } from './dto/payout.dto';
import { PayoutStatus, LedgerEntryType, PaymentStatus } from '../../shared/enums';
import { NombaService } from '../../core/nomba/nomba.service';
import { AuditService } from '../../core/audit';

const PAYOUT_FEE = 50; // ₦50 flat platform fee per payout

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);

  constructor(
    @InjectRepository(Payout)
    private readonly payoutRepo: Repository<Payout>,
    @InjectRepository(MerchantLedger)
    private readonly ledgerRepo: Repository<MerchantLedger>,
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
    private readonly nombaService: NombaService,
    private readonly audit: AuditService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Compute available balance from the ledger.
   * Available = SUM(credits) - SUM(debits)
   */
  async getAvailableBalance(merchantId: string): Promise<{
    availableBalance: number;
    totalEarned: number;
    totalPaidOut: number;
    pendingPayouts: number;
    currency: string;
  }> {
    // 1. Calculate raw ledger balance: SUM(credits) - SUM(debits)
    const creditResult = await this.ledgerRepo
      .createQueryBuilder('l')
      .select('COALESCE(SUM(l.amount), 0)', 'total')
      .where('l.merchantId = :merchantId', { merchantId })
      .andWhere('l.type = :type', { type: LedgerEntryType.CREDIT })
      .getRawOne();

    const debitResult = await this.ledgerRepo
      .createQueryBuilder('l')
      .select('COALESCE(SUM(l.amount), 0)', 'total')
      .where('l.merchantId = :merchantId', { merchantId })
      .andWhere('l.type = :type', { type: LedgerEntryType.DEBIT })
      .getRawOne();

    const totalCredits = parseFloat(creditResult?.total || '0');
    const totalDebits = parseFloat(debitResult?.total || '0');
    const availableBalance = totalCredits - totalDebits;

    // 2. Calculate Total Earned: ONLY sum credits from customer payments (exclude reversals)
    const earnedResult = await this.ledgerRepo
      .createQueryBuilder('l')
      .select('COALESCE(SUM(l.amount), 0)', 'total')
      .where('l.merchantId = :merchantId', { merchantId })
      .andWhere('l.type = :type', { type: LedgerEntryType.CREDIT })
      .andWhere('l.referenceType = :refType', { refType: 'transaction' })
      .getRawOne();

    const totalEarned = parseFloat(earnedResult?.total || '0');

    // 3. Calculate Total Paid Out: ONLY sum successfully COMPLETED payouts
    const paidOutResult = await this.payoutRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.requestedAmount), 0)', 'total')
      .where('p.merchantId = :merchantId', { merchantId })
      .andWhere('p.status = :status', { status: PayoutStatus.COMPLETED })
      .getRawOne();

    const totalPaidOut = parseFloat(paidOutResult?.total || '0');

    // 4. Calculate Pending Payouts in queue
    const pendingResult = await this.payoutRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.requestedAmount), 0)', 'total')
      .where('p.merchantId = :merchantId', { merchantId })
      .andWhere('p.status = :status', { status: PayoutStatus.PENDING })
      .getRawOne();

    const pendingPayouts = parseFloat(pendingResult?.total || '0');

    return {
      availableBalance: Math.max(0, availableBalance),
      totalEarned,
      totalPaidOut,
      pendingPayouts,
      currency: 'NGN',
    };
  }


  /**
   * Create a ledger CREDIT entry when a subscriber payment succeeds.
   * Called from BillingService after a successful charge.
   */
  async recordRevenue(
    merchantId: string,
    amount: number,
    transactionId: string,
    description: string,
  ): Promise<MerchantLedger> {
    const balance = await this.getAvailableBalance(merchantId);
    const runningBalance = balance.availableBalance + amount;

    const entry = this.ledgerRepo.create({
      merchantId,
      type: LedgerEntryType.CREDIT,
      amount,
      currency: 'NGN',
      description,
      referenceId: transactionId,
      referenceType: 'transaction',
      runningBalance,
    });

    return this.ledgerRepo.save(entry);
  }

  /**
   * Request a payout — validates balance, triggers Nomba transfer, creates ledger debit.
   */
  async createPayout(merchantId: string, dto: CreatePayoutDto): Promise<Payout> {
    const balance = await this.getAvailableBalance(merchantId);
    const netAmount = dto.amount - PAYOUT_FEE;

    if (netAmount <= 0) {
      throw new BadRequestException(
        `Payout amount must be greater than the platform fee of ₦${PAYOUT_FEE}`,
      );
    }

    if (dto.amount > balance.availableBalance) {
      throw new BadRequestException(
        `Insufficient balance. Available: ₦${balance.availableBalance.toFixed(2)}, Requested: ₦${dto.amount}`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let payout: Payout;

    try {
      // 1. Create payout record in PROCESSING state
      payout = queryRunner.manager.create(Payout, {
        merchantId,
        requestedAmount: dto.amount,
        platformFee: PAYOUT_FEE,
        netAmount,
        currency: 'NGN',
        bankAccountName: dto.bankAccountName,
        bankAccountNumber: dto.bankAccountNumber,
        bankCode: dto.bankCode,
        bankName: dto.bankName,
        notes: dto.notes ?? null,
        status: PayoutStatus.PROCESSING,
      });
      payout = await queryRunner.manager.save(payout);

      // 2. Debit ledger: payout principal
      const balanceAfterDebit = balance.availableBalance - dto.amount;
      const debitEntry = queryRunner.manager.create(MerchantLedger, {
        merchantId,
        type: LedgerEntryType.DEBIT,
        amount: dto.amount,
        currency: 'NGN',
        description: `Payout to ${dto.bankAccountName} (${dto.bankName} - ${dto.bankAccountNumber})`,
        referenceId: payout.id,
        referenceType: 'payout',
        runningBalance: balanceAfterDebit,
      });
      await queryRunner.manager.save(debitEntry);

      // 3. Commit so the payout record exists before calling Nomba
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    // 4. Trigger Nomba transfer (outside transaction — network call)
    const reference = `payout_${payout.id}_${Date.now()}`;
    try {
      const transfer = await this.nombaService.transferFunds(
        netAmount,
        dto.bankAccountNumber,
        dto.bankCode,
        dto.bankAccountName,
        reference,
        `Encore Payout — ${merchantId.slice(0, 8)}`,
      );

      payout.status = PayoutStatus.COMPLETED;
      payout.nombaReference = transfer.nombaReference;
      payout.nombaTransactionId = transfer.transactionId;
      payout.nombaResponse = JSON.stringify(transfer);
      payout.processedAt = new Date();

      // Save verified bank account to merchant settings for future pre-population
      try {
        const merchantRepo = this.payoutRepo.manager.getRepository(Merchant);
        const merchant = await merchantRepo.findOne({ where: { id: merchantId } });
        if (merchant) {
          merchant.settings = {
            ...(merchant.settings || {}),
            payoutBankAccount: {
              bankCode: dto.bankCode,
              bankName: dto.bankName,
              accountNumber: dto.bankAccountNumber,
              accountName: dto.bankAccountName,
            },
          };
          await merchantRepo.save(merchant);
        }
      } catch (saveErr: any) {
        this.logger.error(`Failed to save merchant payout bank details: ${saveErr.message}`);
      }

    } catch (err: any) {
      this.logger.error(`Payout Nomba transfer failed: ${err.message}`, err.stack);
      payout.status = PayoutStatus.FAILED;
      payout.failureReason = err.message;
      payout.failedAt = new Date();

      // Reverse the ledger debit — put money back
      await this.ledgerRepo.save(
        this.ledgerRepo.create({
          merchantId,
          type: LedgerEntryType.CREDIT,
          amount: dto.amount,
          currency: 'NGN',
          description: `Reversal of failed payout ${payout.id}`,
          referenceId: payout.id,
          referenceType: 'payout_reversal',
          runningBalance: balance.availableBalance,
        }),
      );

      // Save the failed payout status to the database before throwing
      await this.payoutRepo.save(payout);

      throw new BadRequestException(`Nomba bank transfer failed: ${err.message}`);
    }


    const saved = await this.payoutRepo.save(payout);

    await this.audit.log({
      action: 'PAYOUT_CREATED',
      entityType: 'payout',
      entityId: saved.id,
      merchantId,
      metadata: {
        amount: dto.amount,
        netAmount,
        status: saved.status,
        bank: dto.bankName,
      },
      severity: 'normal',
    });

    return saved;
  }

  /** List all payouts for a merchant (newest first) */
  async findAll(merchantId: string): Promise<Payout[]> {
    return this.payoutRepo.find({
      where: { merchantId },
      order: { createdAt: 'DESC' },
    });
  }

  /** Get a single payout */
  async findOne(merchantId: string, id: string): Promise<Payout> {
    const payout = await this.payoutRepo.findOne({ where: { id, merchantId } });
    if (!payout) throw new NotFoundException('Payout not found');
    return payout;
  }

  /** Cancel a PENDING payout */
  async cancelPayout(merchantId: string, id: string): Promise<Payout> {
    const payout = await this.findOne(merchantId, id);
    if (payout.status !== PayoutStatus.PENDING) {
      throw new BadRequestException('Only PENDING payouts can be cancelled');
    }

    // Reverse the ledger debit
    const balance = await this.getAvailableBalance(merchantId);
    await this.ledgerRepo.save(
      this.ledgerRepo.create({
        merchantId,
        type: LedgerEntryType.CREDIT,
        amount: payout.requestedAmount,
        currency: 'NGN',
        description: `Cancellation reversal of payout ${payout.id}`,
        referenceId: payout.id,
        referenceType: 'payout_reversal',
        runningBalance: balance.availableBalance + payout.requestedAmount,
      }),
    );

    payout.status = PayoutStatus.CANCELLED;
    payout.cancelledAt = new Date();
    return this.payoutRepo.save(payout);
  }

  /** Get ledger entries for a merchant */
  async getLedger(merchantId: string): Promise<MerchantLedger[]> {
    return this.ledgerRepo.find({
      where: { merchantId },
      order: { createdAt: 'DESC' },
    });
  }
}
