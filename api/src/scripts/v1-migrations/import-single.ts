import { ImportReport, differenceInSeconds, run } from '../util';
import { importActivityLogs } from './invoices/import-activity-logs';
import { importDocuments } from './invoices/import-documents';
import { importInvoices } from './invoices/import-invoices';
import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../modules/app';

type Operation = (
  clientId: null | string,
  report: ImportReport,
  app: INestApplicationContext,
) => Promise<void>;

const operations: Operation[] = [
  importInvoices,
  importDocuments,
  importActivityLogs,
];

const report = new ImportReport();
const importAll = async () => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const startTime = Date.now();
  const clientIds = [null];
  for (const operation of operations) {
    for (const clientId of clientIds) {
      await operation(clientId, report, app);
    }
  }
  const endTime = Date.now();
  console.log(
    `Import script run time: ${differenceInSeconds(endTime, startTime)}s`,
  );
};

run(importAll, report, __dirname, { logError: true });
