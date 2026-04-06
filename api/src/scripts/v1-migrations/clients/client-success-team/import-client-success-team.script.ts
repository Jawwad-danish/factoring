/**
 * This script will migrate from v1 data about clients success teams
 */
import { environment } from '@core/environment';
import { DatabaseService } from '@module-database';

import { ClientSuccessTeamEntity } from '@module-persistence/entities';
import { ClientSuccessTeamRepository } from '@module-persistence/repositories';
import { INestApplicationContext } from '@nestjs/common';
import {
  ImportReport,
  OnConflictStrategy,
  importEntities,
  referenceUserData,
} from '../../../util';
import { buildClientSuccessTeam } from './client-success-team-mapper';

const PATH = environment.util.checkAndGetForEnvVariable(
  'SCRIPT_IMPORT_CLIENTS_DATA_PATH',
);
const clientSuccessTeamRegistry = new Set<string>();

export const importClientSuccessTeams = async (
  report: ImportReport,
  app: INestApplicationContext,
) => {
  const databaseService = app.get(DatabaseService);
  const clientSuccessTeamRepostory = app.get(ClientSuccessTeamRepository);
  await importEntities<ClientSuccessTeamEntity>({
    path: PATH,
    report: report.ofDomain('client-success-team'),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mapperFn: (clientData, em) => {
      if (clientSuccessTeamRegistry.has(clientData.account_manager.id)) {
        return null;
      }
      clientSuccessTeamRegistry.add(clientData.account_manager.id);
      const entity = buildClientSuccessTeam(clientData.account_manager);
      referenceUserData(entity, clientData, em);
      return entity;
    },
    dependencies: {
      databaseService,
      repository: clientSuccessTeamRepostory,
    },
    saveOptions: {
      onConflict: {
        strategy: OnConflictStrategy.MERGE,
        fields: ['id'],
      },
    },
  });
};
