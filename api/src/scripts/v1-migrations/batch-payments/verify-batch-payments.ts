import { environment } from '@core/environment';
import { DatabaseService } from '@module-database';
import { ClientBatchPaymentEntity } from '@module-persistence/entities';
import { ClientBatchPaymentRepository } from '@module-persistence/repositories';
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
import { buildEntity } from './client-batch-payment-mapper';

const report = new ParityReport('batch-payment', 'id', true);

const batchClientPaymentParityChecker =
  new ParityChecker<ClientBatchPaymentEntity>(
    [new FieldEqualityManager('status'), new FieldEqualityManager('type')],
    report,
  );

export const verifyBatchPaymentsParity = async (
  masterReport: MasterParityReport,
) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const databaseService = app.get(DatabaseService);
  const batchPaymentsRepository = app.get(ClientBatchPaymentRepository);

  masterReport.addReport(report);
  await verifyParity<ClientBatchPaymentEntity>({
    path: environment.util.checkAndGetForEnvVariable(
      'SCRIPT_IMPORT_BATCH_PAYMENTS_PATH',
    ),
    checker: batchClientPaymentParityChecker,
    itemProvider: new ParityItemProvider<ClientBatchPaymentEntity>(),
    mapperFn: (item) => {
      return buildEntity(item);
    },
    afterCheckHook: async (file, v1Item) => {
      const v2BatchPayment = await batchPaymentsRepository.findOneById(
        v1Item.id,
      );
      if (v2BatchPayment != null) {
        batchClientPaymentParityChecker.checkEquality(v1Item, v2BatchPayment);
      } else {
        batchClientPaymentParityChecker.report.addMissing(file, v1Item);
      }
    },
    dependencies: {
      databaseService,
      repository: app.get(ClientBatchPaymentRepository),
    },
  });
};
