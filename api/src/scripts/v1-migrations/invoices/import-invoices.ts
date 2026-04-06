import { environment } from '@core/environment';
import { DatabaseService } from '@module-database';
import { InvoiceEntity } from '@module-persistence/entities';
import {
  InvoiceRepository,
  TagDefinitionRepository,
} from '@module-persistence/repositories';
import { INestApplicationContext } from '@nestjs/common';
import * as path from 'path';
import { ImportReport, OnConflictStrategy } from '../../util';
import { importEntities, referenceUserData } from '../../util/batch';
import { buildCompleteInvoiceEntity } from './invoice-mapper';

const PATH = environment.util.checkAndGetForEnvVariable(
  'SCRIPT_IMPORT_INVOICES_PATH',
);

export const importInvoices = async (
  clientId: null | string,
  report: ImportReport,
  app: INestApplicationContext,
) => {
  const databaseService = app.get(DatabaseService);
  const invoiceRepository = app.get(InvoiceRepository);
  const tagRepository = app.get(TagDefinitionRepository);
  const tagDefinitions = await getTagDefinitions(
    databaseService,
    tagRepository,
  );
  await importEntities<InvoiceEntity>({
    report: report.ofDomain('invoice'),
    path: path.resolve(PATH, clientId ?? ''),
    mapperFn: (item, em) => {
      const entity = buildCompleteInvoiceEntity(item, tagDefinitions[0], em);
      referenceUserData(entity, item, em);
      return entity;
    },
    dependencies: { databaseService, repository: invoiceRepository },
    saveOptions: {
      onConflict: {
        strategy: OnConflictStrategy.MERGE,
        fields: ['id'],
      },
    },
  });
};

const getTagDefinitions = async (
  databaseService: DatabaseService,
  tagRepository: TagDefinitionRepository,
) => {
  return databaseService.withRequestContext(() => tagRepository.findAll({}));
};

// const report = new ImportReport();
// run(
//   () => importInvoices('f7d50d0d-899e-41b7-9419-b62f9cbf10cc', report),
//   report,
//   __dirname,
// );
