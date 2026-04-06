import { environment } from '@core/environment';
import { AppModule } from '@module-app';
import { DatabaseService } from '@module-database';
import { InvoiceHistoryEntity } from '@module-persistence/history';
import { InvoiceHistoryRepository } from '@module-persistence/repositories';
import { NestFactory } from '@nestjs/core';
import * as path from 'path';
import { ImportReport, OnConflictStrategy, run } from '../../../util';
import { importEntities } from '../../../util/batch';
import { buildEntity } from './invoice-history-mapper';

const PATH = environment.util.checkAndGetForEnvVariable(
  'SCRIPT_IMPORT_HISTORY_INVOICES_PATH',
);

export const importInvoicesHistory = async (report: ImportReport) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const databaseService = app.get(DatabaseService);
  const invoiceHistoryRepository = app.get(InvoiceHistoryRepository);
  await importEntities<InvoiceHistoryEntity>({
    report: report.ofDomain('invoice_history'),
    path: path.resolve(PATH),
    mapperFn: (item) => {
      const entity = buildEntity(item);
      return entity;
    },
    dependencies: { databaseService, repository: invoiceHistoryRepository },
    saveOptions: {
      onConflict: {
        strategy: OnConflictStrategy.MERGE,
        fields: ['id'],
      },
    },
  });
};

const report = new ImportReport();
run(() => importInvoicesHistory(report), report, __dirname);
