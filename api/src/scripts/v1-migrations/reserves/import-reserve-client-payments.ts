import { getDateInBusinessTimezone } from '@core/date-time';
import { environment } from '@core/environment';
import { DatabaseService } from '@module-database';
import {
  ClientBatchPaymentEntity,
  ClientBatchPaymentStatus,
  ClientPaymentEntity,
  ClientPaymentOperationType,
  ClientPaymentType,
  PaymentStatus,
  PaymentType,
  ReserveClientPaymentEntity,
  ReserveEntity,
  UserEntity,
} from '@module-persistence/entities';
import {
  ClientBatchPaymentRepository,
  ReserveClientPaymentRepository,
} from '@module-persistence/repositories';
import { INestApplicationContext } from '@nestjs/common';
import Big from 'big.js';
import * as path from 'path';
import { ImportReport, getFiles, importEntities, parseJSON } from '../../util';
import { buildReserveClientPaymentEntity } from './reserve-mapper';

const PATH = environment.util.checkAndGetForEnvVariable(
  'SCRIPT_IMPORT_RESERVES_PATH',
);

const BANK_ACCOUNT_ID = '00000000-0000-0000-0000-000000000000'; // used for reserves from the version of the bobtail app before v1
const BANK_ACCOUNT_LAST_DIGITS = '0000'; // used for reserves from the version of the bobtail app before v1

export const importReserveClientPayments = async (
  clientId: null | string,
  report: ImportReport,
  app: INestApplicationContext,
) => {
  const databaseService = app.get(DatabaseService);
  const repository = app.get(ReserveClientPaymentRepository);
  const clientBatchPaymentRepository = app.get(ClientBatchPaymentRepository);

  const clientBatchPaymentNames = new Set<string>();
  const files = getFiles(path.resolve(PATH, clientId ?? ''));
  for (const file of files) {
    const items = parseJSON(file);
    for (const item of items) {
      if (item.firebase_key) {
        const batchPaymentName = `manual-${
          item.firebase_key
        }-12pm-${getDateInBusinessTimezone(item.created_at).format(
          'YYYY-MM-DD',
        )}`;
        clientBatchPaymentNames.add(batchPaymentName);
      }
    }
  }

  const batchPaymentsByName = new Map<string, ClientBatchPaymentEntity>();
  await databaseService.withRequestContext(async () => {
    const existingBatchPayments = await clientBatchPaymentRepository.find({
      name: { $in: Array.from(clientBatchPaymentNames) },
    });

    for (const payment of existingBatchPayments) {
      batchPaymentsByName.set(payment.name, payment);
    }
  });

  await importEntities<ReserveClientPaymentEntity>({
    path: path.resolve(PATH, clientId ?? ''),
    report: report.ofDomain('reserve-client-payments'),
    mapperFn: (item, em) => {
      // handle firebase paid reserve client payments
      if (item.firebase_key) {
        const batchPaymentName = `manual-${
          item.firebase_key
        }-12pm-${getDateInBusinessTimezone(item.created_at).format(
          'YYYY-MM-DD',
        )}`;

        let batchPayment = batchPaymentsByName.get(batchPaymentName);
        if (!batchPayment) {
          batchPayment = new ClientBatchPaymentEntity();
          batchPayment.createdAt = item.created_at;
          batchPayment.updatedAt = item.updated_at;
          batchPayment.createdBy = em.getReference(UserEntity, item.updated_by); // as balance does not have created_by
          batchPayment.updatedBy = em.getReference(UserEntity, item.updated_by);
          batchPayment.expectedPaymentDate = getDateInBusinessTimezone(
            item.created_at,
          )
            .add(1, 'day')
            .toDate(); // dayjs logic + 1 day
          batchPayment.name = batchPaymentName;
          batchPayment.type = PaymentType.ACH;
          batchPayment.status = ClientBatchPaymentStatus.Done;
        }

        const entity = buildReserveClientPaymentEntity(item, em);
        entity.reserve = em.getReference(ReserveEntity, item.id);
        const clientPayment = new ClientPaymentEntity();
        clientPayment.amount = Big(item.amount);
        clientPayment.type = ClientPaymentType.Reserve;
        clientPayment.operationType = ClientPaymentOperationType.Credit;
        clientPayment.clientId = item.client_id;
        clientPayment.transferType = PaymentType.ACH;
        clientPayment.status = PaymentStatus.DONE;
        clientPayment.clientBankAccountId = BANK_ACCOUNT_ID;
        clientPayment.bankAccountLastDigits = BANK_ACCOUNT_LAST_DIGITS;
        clientPayment.createdAt = item.created_at;
        clientPayment.updatedAt = item.updated_at;
        clientPayment.updatedBy = em.getReference(UserEntity, item.updated_by);
        clientPayment.createdBy = em.getReference(UserEntity, item.updated_by); // as balance does not have created_by

        clientPayment.batchPayment = batchPayment;
        entity.clientPayment = clientPayment;

        return entity;
      }
      if (item.client_paymentid) {
        const entity = buildReserveClientPaymentEntity(item, em);
        entity.reserve = em.getReference(ReserveEntity, item.id);
        entity.clientPayment = em.getReference(
          ClientPaymentEntity,
          item.client_paymentid,
        );

        return entity;
      }

      return null;
    },
    dependencies: { databaseService, repository: repository },
  });
};

// run(
//   () => importReserves('8f4895dc-6bef-47e6-b1d9-b7d134952e49'),
//   RESULT,
//   __dirname,
// );
