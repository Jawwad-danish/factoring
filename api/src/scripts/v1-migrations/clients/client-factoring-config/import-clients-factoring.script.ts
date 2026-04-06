/**
 * This script will migrate from v1 data about clients factoring config
 */
import { environment } from '@core/environment';
import { DatabaseService } from '@module-database';
import {
  ClientFactoringConfigsEntity,
  ClientSuccessTeamEntity,
  EmployeeEntity,
  UserEntity,
} from '@module-persistence/entities';
import {
  ClientFactoringConfigsRepository,
  ClientFactoringRateReasonRepository,
  ClientReserveRateReasonRepository,
  ClientStatusReasonConfigRepository,
} from '@module-persistence/repositories';
import { INestApplicationContext } from '@nestjs/common';
import {
  ImportReport,
  OnConflictStrategy,
  importEntities,
  referenceUserData,
} from '../../../util';
import {
  addClientLimitHistory,
  addFactoringRateHistory,
  addPaymentPlanHistory,
  addReserveRateHistory,
  addStatusHistory,
  addUnderwritingNotes,
  buildClientFactoringConfig,
  getFactoringRateReasons,
  getReserveRateReasons,
  getStatusReasons,
} from './client-factoring-config-mapper';

const PATH = environment.util.checkAndGetForEnvVariable(
  'SCRIPT_IMPORT_CLIENTS_DATA_PATH',
);

export const importClientFactoringConfig = async (
  report: ImportReport,
  app: INestApplicationContext,
) => {
  const databaseService = app.get(DatabaseService);
  const clientFactoringConfigsRepository = app.get(
    ClientFactoringConfigsRepository,
  );
  const clientFactoringRateReasonRepository = app.get(
    ClientFactoringRateReasonRepository,
  );

  const clientReserveRateReasonRepository = app.get(
    ClientReserveRateReasonRepository,
  );

  const clientStatusReasonConfigRepository = app.get(
    ClientStatusReasonConfigRepository,
  );

  const factoringRateReasons = await getFactoringRateReasons(
    databaseService,
    clientFactoringRateReasonRepository,
  );

  const reserveRateReasons = await getReserveRateReasons(
    databaseService,
    clientReserveRateReasonRepository,
  );

  const statusReasons = await getStatusReasons(
    databaseService,
    clientStatusReasonConfigRepository,
  );

  await importEntities<ClientFactoringConfigsEntity>({
    path: PATH,
    report: report.ofDomain('client-factoring-config'),
    mapperFn: (item, em) => {
      const entity = buildClientFactoringConfig(item);
      addFactoringRateHistory(entity, item, em, factoringRateReasons[0]);
      addReserveRateHistory(entity, item, em, reserveRateReasons[0]);
      addStatusHistory(entity, item, em, statusReasons[0]);
      addClientLimitHistory(entity, item, em);
      addPaymentPlanHistory(entity, item, em);
      addUnderwritingNotes(entity, item, em);
      entity.clientSuccessTeam = em.getReference(
        ClientSuccessTeamEntity,
        item.account_manager_id,
      );
      if (item.sales_rep_id) {
        entity.salesRep = em.getReference(EmployeeEntity, item.sales_rep_id);
      }
      entity.user = em.getReference(UserEntity, item.user_id);
      referenceUserData(entity, item, em);
      return entity;
    },
    dependencies: {
      databaseService,
      repository: clientFactoringConfigsRepository,
    },
    saveOptions: {
      onConflict: {
        strategy: OnConflictStrategy.MERGE,
        fields: ['clientId'],
      },
    },
  });
};
