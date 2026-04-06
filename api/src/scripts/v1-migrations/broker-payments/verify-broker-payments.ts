import { environment } from '@core/environment';
import { DatabaseService } from '@module-database';
import {
  BrokerPaymentEntity,
  BrokerPaymentType,
} from '@module-persistence/entities';
import { BrokerPaymentRepository } from '@module-persistence/repositories';
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
import { buildEntity } from './broker-payment-mapper';

const report = new ParityReport('broker-payments', 'id', true);
class TypeFieldEqualityManager extends FieldEqualityManager<BrokerPaymentEntity> {
  constructor() {
    super('type');
  }
  areFieldsEqual(
    v1Entity: BrokerPaymentEntity,
    v2Entity: BrokerPaymentEntity,
  ): boolean {
    const areFieldsEqual = this.defaultEqualityChecker(v1Entity, v2Entity);
    if (!areFieldsEqual && v1Entity.amount.eq(0) && v2Entity.amount.eq(0)) {
      return (
        v1Entity.type === BrokerPaymentType.Check && v2Entity.type === null
      );
    }
    return areFieldsEqual;
  }
}

const parityChecker = new ParityChecker<BrokerPaymentEntity>(
  [new FieldEqualityManager('amount'), new TypeFieldEqualityManager()],
  report,
);

export const verifyBrokerPaymentsParity = async (
  masterReport: MasterParityReport,
) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const databaseService = app.get(DatabaseService);

  masterReport.addReport(report);
  await verifyParity<BrokerPaymentEntity>({
    path: environment.util.checkAndGetForEnvVariable(
      'SCRIPT_IMPORT_BROKER_PAYMENTS_PATH',
    ),
    checker: parityChecker,
    itemProvider: new ParityItemProvider<BrokerPaymentEntity>(),
    mapperFn: (item) => buildEntity(item),
    dependencies: {
      databaseService,
      repository: app.get(BrokerPaymentRepository),
    },
  });
};
