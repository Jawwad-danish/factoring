import { environment } from '@core/environment';
import { DatabaseService } from '@module-database';
import {
  BrokerFactoringConfigEntity,
  BrokerFactoringConfigRepository,
} from '@module-persistence';
import { INestApplicationContext } from '@nestjs/common';
import { importEntities, ImportReport } from 'src/scripts/util';
import {
  addBrokerLimitHistory,
  buildBrokerFactoringConfig,
} from './broker-factoring-config-mapper';
import * as path from 'path';

const PATH = environment.util.checkAndGetForEnvVariable(
  'SCRIPT_IMPORT_BROKERS_DATA_PATH',
);

export const importBrokerFactoringConfig = async (
  brokerId: null | string,
  report: ImportReport,
  app: INestApplicationContext,
) => {
  const databaseService = app.get(DatabaseService);
  const brokerFactoringConfigRepository = app.get(
    BrokerFactoringConfigRepository,
  );

  await importEntities<BrokerFactoringConfigEntity>({
    report: report.ofDomain('broker-factoring-config'),
    path: path.resolve(PATH, brokerId ?? ''),
    mapperFn: (item, em) => {
      const entity = buildBrokerFactoringConfig(item, em);
      addBrokerLimitHistory(entity, item, em);
      return entity;
    },
    dependencies: {
      databaseService,
      repository: brokerFactoringConfigRepository,
    },
  });
};
