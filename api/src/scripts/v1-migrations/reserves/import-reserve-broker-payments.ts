import { environment } from '@core/environment';
import { DatabaseService } from '@module-database';
import {
  BrokerPaymentEntity,
  ReserveBrokerPaymentEntity,
  ReserveEntity,
} from '@module-persistence/entities';
import { ReserveBrokerPaymentRepository } from '@module-persistence/repositories';
import { INestApplicationContext } from '@nestjs/common';
import * as path from 'path';
import { ImportReport, OnConflictStrategy, importEntities } from '../../util';
import { buildReserveBrokerPaymentEntity } from './reserve-mapper';

const PATH = environment.util.checkAndGetForEnvVariable(
  'SCRIPT_IMPORT_RESERVES_PATH',
);

export const importReserveBrokerPayments = async (
  clientId: null | string,
  report: ImportReport,
  app: INestApplicationContext,
) => {
  const databaseService = app.get(DatabaseService);
  const repository = app.get(ReserveBrokerPaymentRepository);

  await importEntities<ReserveBrokerPaymentEntity>({
    path: path.resolve(PATH, clientId ?? ''),
    report: report.ofDomain('reserve-broker-payment'),
    mapperFn: (item, em) => {
      if (item.debtor_payment_id) {
        const entity = buildReserveBrokerPaymentEntity(item, em);
        entity.reserve = em.getReference(ReserveEntity, item.id);
        entity.brokerPayment = em.getReference(
          BrokerPaymentEntity,
          item.debtor_payment_id,
        );

        return entity;
      }

      return null;
    },
    dependencies: { databaseService, repository: repository },
    saveOptions: {
      onConflict: {
        strategy: OnConflictStrategy.IGNORE,
        fields: ['reserve'],
      },
    },
  });
};

// run(
//   () => importReserves('8f4895dc-6bef-47e6-b1d9-b7d134952e49'),
//   RESULT,
//   __dirname,
// );
