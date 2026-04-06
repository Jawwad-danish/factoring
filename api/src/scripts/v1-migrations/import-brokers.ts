import { ImportReport, differenceInSeconds, run } from '../util';
import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../modules/app';
import { importBrokerFactoringConfig } from './brokers/broker-factoring-config/import-brokers-factoring.script';

type Operation = (
  brokerId: null | string,
  report: ImportReport,
  app: INestApplicationContext,
) => Promise<void>;

const operations: Operation[] = [importBrokerFactoringConfig];

const report = new ImportReport();
const importAll = async () => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const startTime = Date.now();
  const brokerIds = [null];
  for (const operation of operations) {
    for (const brokerId of brokerIds) {
      await operation(brokerId, report, app);
    }
  }
  const endTime = Date.now();
  console.log(
    `Import script run time: ${differenceInSeconds(endTime, startTime)}s`,
  );
  await app.close();
};

run(importAll, report, __dirname, { logError: true });
