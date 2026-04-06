import { environment } from '@core/environment';
import { DatabaseService } from '@module-database';
import {
  InvoiceDocumentEntity,
  InvoiceEntity,
} from '@module-persistence/entities';
import { InvoiceDocumentRepository } from '@module-persistence/repositories';
import { INestApplicationContext } from '@nestjs/common';
import * as path from 'path';
import { ImportReport, OnConflictStrategy } from '../../util';
import { importEntities } from '../../util/batch';
import { mapInvoiceDocuments } from './invoice-documents-mapper';

const PATH = environment.util.checkAndGetForEnvVariable(
  'SCRIPT_IMPORT_INVOICES_PATH',
);

export const importDocuments = async (
  clientId: null | string,
  report: ImportReport,
  app: INestApplicationContext,
) => {
  const databaseService = app.get(DatabaseService);
  const repository = app.get(InvoiceDocumentRepository);

  await importEntities<InvoiceDocumentEntity>({
    report: report.ofDomain('invoice-documents'),
    path: path.resolve(PATH, clientId ?? ''),
    mapperFn: (item, em) => {
      const entities = mapInvoiceDocuments(item, em);
      for (const entity of entities) {
        entity.invoice = em.getReference(InvoiceEntity, item.id);
      }
      return entities;
    },
    dependencies: { databaseService, repository: repository },
    saveOptions: {
      onConflict: {
        strategy: OnConflictStrategy.MERGE,
        fields: ['id'],
      },
    },
  });
};

// const report = new ImportReport();
// run(
//   () => importInvoices('f7d50d0d-899e-41b7-9419-b62f9cbf10cc', report),
//   report,
//   __dirname,
// );
