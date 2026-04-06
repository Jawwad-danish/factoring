import { environment } from '@core/environment';
import { DatabaseService } from '@module-database';
import {
  ClientBatchPaymentRepository,
  ClientPaymentRepository,
  InvoiceClientPaymentRepository,
} from '@module-persistence/repositories';
import Big from 'big.js';
import * as path from 'path';
import {
  ClientPaymentEntity,
  InvoiceClientPaymentEntity,
  InvoiceEntity,
} from '../../../modules/persistence';
import { OnConflictStrategy } from '../../util';
import { importEntities, referenceUserData } from '../../util/batch';
import { ImportReport } from '../../util/report';
import { buildEntity as buildClientPaymentEntity } from './client-payment-mapper';
import { buildInvoiceClientPaymentEntity } from './invoice-client-payment-mapper';
import { INestApplicationContext } from '@nestjs/common';

const PATH = environment.util.checkAndGetForEnvVariable(
  'SCRIPT_IMPORT_CLIENT_PAYMENTS_PATH',
);

export const importClientPayments = async (
  clientId: null | string,
  report: ImportReport,
  app: INestApplicationContext,
) => {
  const databaseService = app.get(DatabaseService);
  const clientPaymentRepository = app.get(ClientPaymentRepository);
  const clientBatchPaymentRepository = app.get(ClientBatchPaymentRepository);
  const clientBatchPayments = await getClientBatchPayments(
    databaseService,
    clientBatchPaymentRepository,
  );
  await importEntities({
    path: path.resolve(PATH, clientId ?? ''),
    report: report.ofDomain('client-payments'),
    mapperFn: (item, em) => {
      const batchPayment = clientBatchPayments[0].find(
        (batchPayment) => batchPayment.id === item.batch_payment.id,
      );
      if (!batchPayment) {
        return null;
      }
      const entity = buildClientPaymentEntity(item, batchPayment);
      referenceUserData(entity, item, em);
      return entity;
    },
    dependencies: { databaseService, repository: clientPaymentRepository },
    saveOptions: {
      onConflict: {
        strategy: OnConflictStrategy.MERGE,
        fields: ['id'],
      },
    },
  });
};
export const importInvoiceClientPayments = async (
  clientId: null | string,
  report: ImportReport,
  app: INestApplicationContext,
) => {
  const databaseService = app.get(DatabaseService);
  const invoiceClientPaymentRepository = app.get(
    InvoiceClientPaymentRepository,
  );
  await importEntities<InvoiceClientPaymentEntity>({
    path: path.resolve(PATH, clientId ?? ''),
    report: report.ofDomain('invoice-client-payments'),
    mapperFn: (item, em) => {
      if (!item.invoices) {
        return null;
      }
      const entities: InvoiceClientPaymentEntity[] = item.invoices.map(
        (invoice: any) => {
          const entity = buildInvoiceClientPaymentEntity(
            item,
            new Big(invoice.total_amount),
          );
          referenceUserData(entity, item, em);
          entity.invoice = em.getReference(InvoiceEntity, invoice.id);
          entity.clientPayment = em.getReference(ClientPaymentEntity, item.id);
          return entity;
        },
      );
      return entities;
    },
    dependencies: {
      databaseService,
      repository: invoiceClientPaymentRepository,
    },
  });
};

const getClientBatchPayments = async (
  databaseService: DatabaseService,
  clientBatchPaymentRepository: ClientBatchPaymentRepository,
) => {
  return databaseService.withRequestContext(() =>
    clientBatchPaymentRepository.findAll({}),
  );
};

// run(
//   () => importClientPayments('8f4895dc-6bef-47e6-b1d9-b7d134952e49'),
//   RESULT,
//   __dirname,
// );
