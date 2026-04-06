import { environment } from '@core/environment';
import { DatabaseService } from '@module-database';
import {
  AuditLogEntity,
  AuditLogRepository,
  BrokerPaymentAuditLogPayload,
} from '@module-persistence';
import { INestApplicationContext } from '@nestjs/common';
import * as path from 'path';
import { importEntities, ImportReport } from 'src/scripts/util';
import { buildBrokerPaymentAuditLogEntity } from './audit-logs-mapper';

const PATH = environment.util.checkAndGetForEnvVariable(
  'SCRIPT_IMPORT_AUDIT_LOGS_BROKER_PAYMENTS_PATH',
);

export const importAuditLogsBrokerPayments = async (
  report: ImportReport,
  app: INestApplicationContext,
) => {
  const databaseService = app.get(DatabaseService);
  const repository = app.get(AuditLogRepository);

  await importEntities<AuditLogEntity>({
    report: report.ofDomain('audit-logs-broker-payments'),
    path: path.resolve(PATH),
    mapperFn: (item, em) => {
      const entity = buildBrokerPaymentAuditLogEntity(item, em);
      return (entity.payload as BrokerPaymentAuditLogPayload).operation ===
        'create'
        ? null
        : entity;
    },
    dependencies: {
      databaseService,
      repository,
    },
  });
};
