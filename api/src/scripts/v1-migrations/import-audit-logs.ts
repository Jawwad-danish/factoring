import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../modules/app';
import { ImportReport, differenceInSeconds, run } from '../util';
import { importAuditLogsBrokerPayments } from './audit-logs/import-audit-logs-broker-payments';

type Operation = (
  report: ImportReport,
  app: INestApplicationContext,
) => Promise<void>;

const operations: Operation[] = [importAuditLogsBrokerPayments];

const report = new ImportReport();
const importAll = async () => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const startTime = Date.now();
  for (const operation of operations) {
    await operation(report, app);
  }
  const endTime = Date.now();
  console.log(
    `Import script run time: ${differenceInSeconds(endTime, startTime)}s`,
  );
  await app.close();
};

run(importAll, report, __dirname, { logError: true });
