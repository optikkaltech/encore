import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  DataSource,
} from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from '../billing/entities/transaction.entity';
import { PayoutsService } from './payouts.service';
import { PaymentStatus } from '../../shared/enums';

/**
 * TransactionSubscriber — listens for changes to Transaction entities.
 * Automatically records revenue in the merchant ledger when a transaction
 * successfully processes.
 */
@EventSubscriber()
@Injectable()
export class TransactionSubscriber
  implements EntitySubscriberInterface<Transaction>
{
  private readonly logger = new Logger(TransactionSubscriber.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly payoutsService: PayoutsService,
  ) {
    this.dataSource.subscribers.push(this);
    this.logger.log('TransactionSubscriber registered with TypeORM.');
  }

  listenTo() {
    return Transaction;
  }

  async afterInsert(event: InsertEvent<Transaction>) {
    try {
      if (
        event.entity.status === PaymentStatus.SUCCESS &&
        event.entity.type !== 'refund'
      ) {
        this.logger.log(
          `Transaction ${event.entity.id} inserted as SUCCESS. Recording revenue...`,
        );
        await this.payoutsService.recordRevenue(
          event.entity.merchantId,
          Number(event.entity.amount),
          event.entity.id,
          `Subscriber payment of ₦${event.entity.amount} (${event.entity.type})`,
        );
      }
    } catch (err: any) {
      this.logger.error(
        `Failed to record revenue for inserted transaction ${event.entity?.id}: ${err.message}`,
      );
    }
  }

  async afterUpdate(event: UpdateEvent<Transaction>) {
    try {
      if (!event.entity || !event.databaseEntity) return;

      const wasSuccess = event.databaseEntity.status === PaymentStatus.SUCCESS;
      const isSuccess = event.entity.status === PaymentStatus.SUCCESS;

      if (!wasSuccess && isSuccess && event.entity.type !== 'refund') {
        this.logger.log(
          `Transaction ${event.entity.id} transitioned to SUCCESS. Recording revenue...`,
        );
        await this.payoutsService.recordRevenue(
          event.entity.merchantId,
          Number(event.entity.amount),
          event.entity.id,
          `Subscriber payment of ₦${event.entity.amount} (${event.entity.type})`,
        );
      }
    } catch (err: any) {
      this.logger.error(
        `Failed to record revenue for updated transaction ${event.entity?.id}: ${err.message}`,
      );
    }
  }
}
