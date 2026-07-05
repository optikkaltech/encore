import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Transaction } from '../billing/entities/transaction.entity';
import { MerchantLedger } from './entities/merchant-ledger.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { PaymentStatus, LedgerEntryType } from '../../shared/enums';

@Injectable()
export class PayoutsBackfillService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PayoutsBackfillService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
    @InjectRepository(MerchantLedger)
    private readonly ledgerRepo: Repository<MerchantLedger>,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Running PayoutsBackfillService: checking for missing ledger entries...');

    try {
      // Find all successful transactions (excluding refunds)
      const successfulTxns = await this.txRepo.find({
        where: { status: PaymentStatus.SUCCESS },
      });

      let backfilledCount = 0;

      for (const tx of successfulTxns) {
        if (tx.type === 'refund') continue;

        // Check if ledger entry already exists for this transaction ID
        const exists = await this.ledgerRepo.findOne({
          where: {
            referenceId: tx.id,
            referenceType: 'transaction',
          },
        });

        if (exists) continue;

        try {
          const description = `Backfilled: Subscriber payment of ₦${tx.amount} (${tx.type})`;
          
          // Save ledger CREDIT entry
          const entry = this.ledgerRepo.create({
            merchantId: tx.merchantId,
            type: LedgerEntryType.CREDIT,
            amount: tx.amount,
            currency: tx.currency || 'NGN',
            description,
            referenceId: tx.id,
            referenceType: 'transaction',
            createdAt: tx.createdAt, // Match original transaction timestamp
          });
          await this.ledgerRepo.save(entry);
          this.logger.log(`Backfilled ledger entry for transaction: ${tx.id}`);
          backfilledCount++;
        } catch (err: any) {
          this.logger.error(`Failed to backfill ledger entry for transaction ${tx.id}: ${err.message}`);
        }
      }

      this.logger.log(`Ledger backfill complete. ${backfilledCount} entries backfilled.`);

      // 2. Generate missing merchantCode
      const merchantRepo = this.txRepo.manager.getRepository(Merchant);
      const merchantsWithNoCode = await merchantRepo.find({
        where: { merchantCode: IsNull() },
      });

      if (merchantsWithNoCode.length > 0) {
        this.logger.log(`Found ${merchantsWithNoCode.length} merchants with missing merchantCode. Backfilling...`);
        for (const m of merchantsWithNoCode) {
          m.merchantCode = await this.generateUniqueMerchantCode(merchantRepo);
          await merchantRepo.save(m);
          this.logger.log(`Generated and saved merchantCode ${m.merchantCode} for merchant ${m.id}`);
        }
      }
    } catch (err: any) {
      this.logger.error(`Error during ledger backfill process: ${err.message}`);
    }
  }

  private async generateUniqueMerchantCode(merchantRepo: Repository<Merchant>): Promise<string> {
    let attempts = 0;
    while (attempts < 100) {
      const code = 'EN' + Math.floor(10000 + Math.random() * 90000);
      const existing = await merchantRepo.findOne({
        where: { merchantCode: code },
      });
      if (!existing) {
        return code;
      }
      attempts++;
    }
    return 'EN' + Date.now().toString().slice(-5);
  }
}
