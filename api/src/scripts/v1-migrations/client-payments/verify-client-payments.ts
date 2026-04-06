import { environment } from '@core/environment';
import { DatabaseService } from '@module-database';
import {
  ClientBatchPaymentEntity,
  ClientPaymentEntity,
} from '@module-persistence/entities';
import {
  ClientBatchPaymentRepository,
  ClientPaymentRepository,
} from '@module-persistence/repositories';
import { NestFactory } from '@nestjs/core';
import { ParityItemProvider } from 'src/scripts/util/parity/parity-item-provider';
import { AppModule } from '../../../modules/app/app.module';
import {
  FieldEqualityManager,
  MasterParityReport,
  ParityChecker,
  ParityReport,
  verifyParity,
} from '../../util/parity';
import { buildEntity as buildClientBatchPaymentEntity } from '../batch-payments/client-batch-payment-mapper';
import { buildEntity as buildClientPaymentEntity } from './client-payment-mapper';

const report = new ParityReport('client-payment', 'id', true);
const clientPaymentParityChecker = new ParityChecker<ClientPaymentEntity>(
  [
    new FieldEqualityManager('amount'),
    new FieldEqualityManager('type'),
    new FieldEqualityManager('status'),
  ],
  report,
);

const batchClientPaymentParityChecker =
  new ParityChecker<ClientBatchPaymentEntity>(
    [new FieldEqualityManager('status'), new FieldEqualityManager('type')],
    new ParityReport('batch-client-payment', 'id'),
  );

export const verifyClientPaymentsParity = async (
  masterReport: MasterParityReport,
) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const databaseService = app.get(DatabaseService);
  const batchPaymentsRepository = app.get(ClientBatchPaymentRepository);

  masterReport.addReport(report);
  await verifyParity<ClientPaymentEntity>({
    path: environment.util.checkAndGetForEnvVariable(
      'SCRIPT_IMPORT_CLIENT_PAYMENTS_PATH',
    ),
    checker: clientPaymentParityChecker,
    itemProvider: new ParityItemProvider<ClientPaymentEntity>(),
    mapperFn: (item) => {
      const v1BatchPayment = buildClientBatchPaymentEntity(item.batch_payment);
      return buildClientPaymentEntity(item, v1BatchPayment);
    },
    afterCheckHook: async (file, v1Item) => {
      const v2BatchPayment = await batchPaymentsRepository.findOneById(
        v1Item.batchPayment.id,
      );
      if (v2BatchPayment != null) {
        batchClientPaymentParityChecker.checkEquality(
          v1Item.batchPayment,
          v2BatchPayment,
        );
      } else {
        batchClientPaymentParityChecker.report.addMissing(
          file,
          v1Item.batchPayment,
        );
      }
    },
    dependencies: {
      databaseService,
      repository: app.get(ClientPaymentRepository),
    },
  });
};
