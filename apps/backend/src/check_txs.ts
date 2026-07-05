import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { Transaction } from './modules/billing/entities/transaction.entity';
import { MerchantLedger } from './modules/payouts/entities/merchant-ledger.entity';
import { PayoutsService } from './modules/payouts/payouts.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  // Explicitly run app init to trigger bootstrap hooks
  await app.init();

  const dataSource = app.get(DataSource);
  const txRepo = dataSource.getRepository(Transaction);
  const ledgerRepo = dataSource.getRepository(MerchantLedger);

  console.log('--- ALL TRANSACTIONS ---');
  const txs = await txRepo.find({ order: { createdAt: 'DESC' } });
  console.log(`Total transactions: ${txs.length}`);
  txs.forEach(tx => {
    console.log(`ID: ${tx.id}, Amount: ${tx.amount}, Status: ${tx.status}, Type: ${tx.type}, MerchantId: ${tx.merchantId}`);
  });

  console.log('\n--- ALL LEDGER ENTRIES ---');
  const entries = await ledgerRepo.find({ order: { createdAt: 'DESC' } });
  console.log(`Total ledger entries: ${entries.length}`);
  entries.forEach(entry => {
    console.log(`ID: ${entry.id}, Amount: ${entry.amount}, Type: ${entry.type}, RefId: ${entry.referenceId}`);
  });

  await app.close();
}

bootstrap().catch(console.error);
