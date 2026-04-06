import { environment } from '@core/environment';
import { DatabaseService } from '@module-database';
import { ReserveEntity } from '@module-persistence/entities';
import { ReserveRepository } from '@module-persistence/repositories';
import { REVERSED_RESERVE_PAYLOAD_KEY } from '@module-reserves/commands';
import { INestApplicationContext } from '@nestjs/common';
import * as path from 'path';
import {
  ImportReport,
  OnConflictStrategy,
  importEntities,
  referenceUserData,
} from '../../util';
import { buildEntity } from './reserve-mapper';

const PATH = environment.util.checkAndGetForEnvVariable(
  'SCRIPT_IMPORT_RESERVES_PATH',
);

export const importReserves = async (
  clientId: null | string,
  report: ImportReport,
  app: INestApplicationContext,
) => {
  const databaseService = app.get(DatabaseService);
  const reserveRepository = app.get(ReserveRepository);

  await importEntities<ReserveEntity>({
    path: path.resolve(PATH, clientId ?? ''),
    report: report.ofDomain('reserves'),
    mapperFn: (item, em) => {
      const entity = buildEntity(item);
      referenceUserData(entity, item, em);
      return entity;
    },
    afterMapperFn: (items, entities) => {
      for (const item of items) {
        if (!item.metadata.deleted_id) {
          continue;
        }
        const entity = entities.find((e) => e.id === item.metadata.deleted_id);
        if (entity) {
          entity.payload = {
            ...entity.payload,
            [REVERSED_RESERVE_PAYLOAD_KEY]: item.id,
          };
        }
      }
    },
    dependencies: { databaseService, repository: reserveRepository },
    saveOptions: {
      onConflict: {
        strategy: OnConflictStrategy.MERGE,
        fields: ['id'],
      },
    },
  });
};

// run(
//   () => importReserves('8f4895dc-6bef-47e6-b1d9-b7d134952e49'),
//   RESULT,
//   __dirname,
// );
