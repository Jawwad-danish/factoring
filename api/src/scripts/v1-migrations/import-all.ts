import { NestFactory } from '@nestjs/core';
import { ImportReport, differenceInSeconds, run } from '../util';
import { importBatchClientPayments } from './batch-payments';
import { importBrokerPayments } from './broker-payments';
import { importClientBrokerAssignments } from './client-broker-assignments';
import {
  importClientPayments,
  importInvoiceClientPayments,
} from './client-payments';
import { importClients } from './clients/import-clients';
import { importActivityLogs } from './invoices/import-activity-logs';
import { importDocuments } from './invoices/import-documents';
import { importInvoices } from './invoices/import-invoices';
import { importReserveAccountFunds } from './reserve-account-funds';
import { importReserves } from './reserves';
import { importReserveBrokerPayments } from './reserves/import-reserve-broker-payments';
import { importReserveClientPayments } from './reserves/import-reserve-client-payments';
import { importReserveInvoices } from './reserves/import-reserve-invoices';
import { AppModule } from '../../modules/app';
import { INestApplicationContext } from '@nestjs/common';

type Operation = (
  clientId: null | string,
  report: ImportReport,
  app: INestApplicationContext,
) => Promise<void>;

const operations: Operation[] = [
  importInvoices,
  importDocuments,
  importActivityLogs,
  importBatchClientPayments,
  importClientPayments,
  importInvoiceClientPayments,
  importBrokerPayments,
  importReserves,
  importReserveInvoices,
  importReserveBrokerPayments,
  importReserveClientPayments,
  importClientBrokerAssignments,
  importReserveAccountFunds,
];

const report = new ImportReport();
const importAll = async () => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const startTime = Date.now();
  console.log('Starting import clients');
  await importClients(report, app);
  console.log(
    `Finished import clients + ${differenceInSeconds(Date.now(), startTime)}s`,
  );
  const clientIds = [null];
  for (const operation of operations) {
    console.log(`Running ${operation.name}`);
    for (const clientId of clientIds) {
      await operation(clientId, report, app);
      console.log(
        `Finished running ${operation.name} + ${differenceInSeconds(
          Date.now(),
          startTime,
        )}s`,
      );
    }
  }
  const endTime = Date.now();
  console.log(
    `Import script run time: ${differenceInSeconds(endTime, startTime)}s`,
  );
};

run(importAll, report, __dirname, { logError: true });
