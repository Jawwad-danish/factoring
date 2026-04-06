import { environment } from '@core/environment';
import { DatabaseService } from '@module-database';
import { ReserveAccountFundsRepository } from '@module-persistence/repositories';
import { INestApplicationContext } from '@nestjs/common';
import * as path from 'path';
import {
  OnConflictStrategy,
  importEntities,
  referenceUserData,
} from '../../util';
import { ImportReport } from '../../util/report';
import { buildEntity } from './reserve-account-funds.mapper';

const PATH = environment.util.checkAndGetForEnvVariable(
  'SCRIPT_IMPORT_RESERVE_ACCOUNT_FUNDS_PATH',
);

export const importReserveAccountFunds = async (
  clientId: null | string,
  report: ImportReport,
  app: INestApplicationContext,
) => {
  const databaseService = app.get(DatabaseService);
  const reserveAccountFundsRepository = app.get(ReserveAccountFundsRepository);

  await importEntities({
    path: path.resolve(PATH, clientId ?? ''),
    report: report.ofDomain('reserve-account-funds'),
    mapperFn: (item, em) => {
      const entity = buildEntity(item);
      referenceUserData(entity, item, em);
      return entity;
    },
    dependencies: {
      databaseService,
      repository: reserveAccountFundsRepository,
    },
    saveOptions: {
      onConflict: {
        strategy: OnConflictStrategy.MERGE,
        fields: ['id'],
      },
    },
  });
};

// run(
//   () => importClientAccountFunds('8f4895dc-6bef-47e6-b1d9-b7d134952e49'),
//   RESULT,
//   __dirname,
// );
