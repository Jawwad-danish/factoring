import { environment } from '@core/environment';
import { DatabaseService } from '@module-database';
import { ActivityLogEntity, InvoiceEntity } from '@module-persistence/entities';
import {
  ActivityLogRepository,
  TagDefinitionRepository,
} from '@module-persistence/repositories';
import { INestApplicationContext } from '@nestjs/common';
import * as path from 'path';
import { ImportReport, OnConflictStrategy } from '../../util';
import { importEntities } from '../../util/batch';
import { mapInvoiceUpdates } from './invoice-updates-mapper';

const PATH = environment.util.checkAndGetForEnvVariable(
  'SCRIPT_IMPORT_INVOICES_PATH',
);

export const importActivityLogs = async (
  clientId: null | string,
  report: ImportReport,
  app: INestApplicationContext,
) => {
  const databaseService = app.get(DatabaseService);
  const repository = app.get(ActivityLogRepository);
  const tagRepository = app.get(TagDefinitionRepository);
  const tagDefinitions = await getTagDefinitions(
    databaseService,
    tagRepository,
  );
  await importEntities<ActivityLogEntity>({
    report: report.ofDomain('invoice-activities'),
    path: path.resolve(PATH, clientId ?? ''),
    mapperFn: (item, em) => {
      const entities = mapInvoiceUpdates(item, tagDefinitions[0], em);
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

const getTagDefinitions = async (
  databaseService: DatabaseService,
  tagRepository: TagDefinitionRepository,
) => {
  return databaseService.withRequestContext(() => tagRepository.findAll({}));
};

// const report = new ImportReport();
// run(
//   () => importActivityLogs(null, report),
//   report,
//   __dirname,
// );
