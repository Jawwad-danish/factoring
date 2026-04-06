import { environment } from '@core/environment';
import { DatabaseService } from '@module-database';
import { ClientBatchPaymentRepository } from '@module-persistence/repositories';
import { INestApplicationContext } from '@nestjs/common';
import * as path from 'path';
import { OnConflictStrategy } from '../../util';
import { importEntities, referenceUserData } from '../../util/batch';
import { ImportReport } from '../../util/report';
import { buildEntity as buildClientBatchPaymentEntity } from './client-batch-payment-mapper';

const BATCH_PAYMENTS_PATH = environment.util.checkAndGetForEnvVariable(
  'SCRIPT_IMPORT_BATCH_PAYMENTS_PATH',
);

export const importBatchClientPayments = async (
  clientId: null | string,
  report: ImportReport,
  app: INestApplicationContext,
) => {
  const databaseService = app.get(DatabaseService);
  const clientBatchPaymentRepository = app.get(ClientBatchPaymentRepository);
  await importEntities({
    path: path.resolve(BATCH_PAYMENTS_PATH, clientId ?? ''),
    report: report.ofDomain('batch-client-payments'),
    mapperFn: (item, em) => {
      const entity = buildClientBatchPaymentEntity(item);
      referenceUserData(entity, item, em);
      return entity;
    },
    dependencies: { databaseService, repository: clientBatchPaymentRepository },
    saveOptions: {
      onConflict: {
        strategy: OnConflictStrategy.MERGE,
        fields: ['id'],
      },
    },
    // There is an edge case where a batch payment is imported
    // from two different clients at the same time, creating a deadlock
    concurrent: 1,
  });
};

// run(
//   () => importBatchClientPayments('8f4895dc-6bef-47e6-b1d9-b7d134952e49'),
//   RESULT,
//   __dirname,
// );
