import { FilterQuery } from '@mikro-orm/core';
import { DatabaseService } from '@module-database';
import { InvoiceEntity, InvoiceRepository } from '@module-persistence';
import { NestFactory } from '@nestjs/core';
import * as fs from 'fs';
import { AppModule } from 'src/modules/app/app.module';
import {
  DuplicateDetectionEngine,
  DuplicateDetectionItem,
} from '../../modules/invoices';
import { run } from '../util';

export const runDuplicateEngineAgainstDb = async () => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const databaseService = app.get(DatabaseService);
  const invoiceRepository = app.get(InvoiceRepository);
  const duplicateDetectionEngine = app.get(DuplicateDetectionEngine);

  const BATCH_SIZE = 50;
  const resultList: Record<string, DuplicateDetectionItem[]> = {};
  databaseService.withRequestContext(
    async () =>
      await runDuplicateEngine(
        invoiceRepository,
        duplicateDetectionEngine,
        resultList,
        BATCH_SIZE,
      ),
  );

  console.log(`\n`);
  fs.writeFileSync(
    `${__dirname}/duplicate_engine_result.json`,
    JSON.stringify(resultList),
  );
};

const runDuplicateEngine = async (
  invoiceRepository: InvoiceRepository,
  engine: DuplicateDetectionEngine,
  resultList: Record<string, DuplicateDetectionItem[]>,
  batchSize: number,
) => {
  const invoiceFilter: FilterQuery<InvoiceEntity> = {
    displayId: ['123'],
  };
  const totalInvoiceCount = await invoiceRepository.count();
  const invoiceCount = await invoiceRepository.count(invoiceFilter);
  for (let batch = 0; batch < Math.ceil(invoiceCount / batchSize); batch++) {
    const offset = batch * batchSize;
    const invoiceBatch = await invoiceRepository.findAll(invoiceFilter, {
      limit: batchSize,
      offset: offset,
    });
    for (const invoice of invoiceBatch[0]) {
      const result = await engine.run(invoice);
      resultList[invoice.displayId] = result;
    }
  }
  console.log(
    `\n\nRan script on a total of ${invoiceCount} invoices. Total number of invoices is ${totalInvoiceCount} \n`,
  );
};

run(runDuplicateEngineAgainstDb, [], __dirname);
