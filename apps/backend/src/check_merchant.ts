import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { Merchant } from './modules/merchants/entities/merchant.entity';
import { Subscriber } from './modules/subscribers/entities/subscriber.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const merchantRepo = dataSource.getRepository(Merchant);
  const subscriberRepo = dataSource.getRepository(Subscriber);

  console.log('--- MERCHANTS ---');
  const merchants = await merchantRepo.find();
  for (const m of merchants) {
    const subCount = await subscriberRepo.count({ where: { merchantId: m.id } });
    console.log({
      id: m.id,
      businessName: m.businessName,
      merchantCode: m.merchantCode,
      accountType: m.accountType,
      status: m.status,
      trialStartedAt: m.trialStartedAt,
      trialEndsAt: m.trialEndsAt,
      currentSubscriberCount: m.currentSubscriberCount,
      actualSubscribersInDb: subCount,
    });
  }

  await app.close();
}

bootstrap().catch(console.error);
