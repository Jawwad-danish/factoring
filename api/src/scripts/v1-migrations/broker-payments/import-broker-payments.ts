import { environment } from '@core/environment';
import { DatabaseService } from '@module-database';
import { InvoiceEntity } from '@module-persistence/entities';
import { BrokerPaymentRepository } from '@module-persistence/repositories';
import * as path from 'path';
import {
  OnConflictStrategy,
  importEntities,
  referenceUserData,
} from '../../util';
import { ImportReport } from '../../util/report';
import { buildEntity } from './broker-payment-mapper';
import { INestApplicationContext } from '@nestjs/common';

const PATH = environment.util.checkAndGetForEnvVariable(
  'SCRIPT_IMPORT_BROKER_PAYMENTS_PATH',
);

export const importBrokerPayments = async (
  clientId: null | string,
  report: ImportReport,
  app: INestApplicationContext,
) => {
  const databaseService = app.get(DatabaseService);
  const brokerPaymentRepository = app.get(BrokerPaymentRepository);

  await importEntities({
    path: path.resolve(PATH, clientId ?? ''),
    report: report.ofDomain('broker-payments'),
    mapperFn: (item, em) => {
      const entity = buildEntity(item);
      referenceUserData(entity, item, em);
      entity.invoice = em.getReference(InvoiceEntity, item.invoice_id);
      return entity;
    },
    dependencies: { databaseService, repository: brokerPaymentRepository },
    saveOptions: {
      onConflict: {
        strategy: OnConflictStrategy.MERGE,
        fields: ['id'],
      },
    },
  });
};

// run(
//   () => importBrokerPayments('8f4895dc-6bef-47e6-b1d9-b7d134952e49'),
//   RESULT,
//   __dirname,
// );
