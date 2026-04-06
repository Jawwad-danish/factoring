import { environment } from '@core/environment';
import { DatabaseService } from '@module-database';
import { ReserveAccountFundsEntity } from '@module-persistence/entities';
import { ReserveAccountFundsRepository } from '@module-persistence/repositories';
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
import { buildEntity } from './reserve-account-funds.mapper';

const report = new ParityReport('reserve-account-funds', 'id', true);
const parityChecker = new ParityChecker<ReserveAccountFundsEntity>(
  [
    new FieldEqualityManager('amount'),
    new FieldEqualityManager('clientId'),
    new FieldEqualityManager('note'),
  ],
  report,
);

export const verifyReserveAccountFundsParity = async (
  masterReport: MasterParityReport,
) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const databaseService = app.get(DatabaseService);

  masterReport.addReport(report);
  await verifyParity<ReserveAccountFundsEntity>({
    path: environment.util.checkAndGetForEnvVariable(
      'SCRIPT_IMPORT_RESERVE_ACCOUNT_FUNDS_PATH',
    ),
    checker: parityChecker,
    itemProvider: new ParityItemProvider<ReserveAccountFundsEntity>(),
    mapperFn: (item) => buildEntity(item),
    dependencies: {
      databaseService,
      repository: app.get(ReserveAccountFundsRepository),
    },
  });
};
