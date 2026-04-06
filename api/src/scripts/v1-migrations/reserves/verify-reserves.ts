import { environment } from '@core/environment';
import { DatabaseService } from '@module-database';
import { ReserveEntity, ReserveReason } from '@module-persistence/entities';
import {
  ReserveBrokerPaymentRepository,
  ReserveInvoiceRepository,
  ReserveRepository,
} from '@module-persistence/repositories';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../modules/app/app.module';
import {
  FieldEqualityManager,
  MasterParityReport,
  ParityChecker,
  ParityItemProvider,
  ParityReport,
  verifyParity,
} from '../../util/parity';
import { buildEntity } from './reserve-mapper';
const report = new ParityReport('reserves', 'id', true);
const parityChecker = new ParityChecker<ReserveEntity>(
  [new FieldEqualityManager('amount'), new FieldEqualityManager('reason')],
  report,
);

class ReserveItemProvider extends ParityItemProvider<ReserveEntity> {
  constructor(
    readonly reserveBrokerPaymentRepository: ReserveBrokerPaymentRepository,
    readonly reserveInvoiceRepository: ReserveInvoiceRepository,
  ) {
    super();
  }
  async getV2Item(
    v1Reserve: ReserveEntity,
    v1RawItem: any,
    v2Reserves: ReserveEntity[],
  ): Promise<ReserveEntity | null> {
    if (v1Reserve.reserveBrokerPayment) {
      const found =
        await this.reserveBrokerPaymentRepository.findByBrokerPaymentId(
          v1Reserve.reserveBrokerPayment.brokerPayment.id,
        );
      return found?.reserve || null;
    }
    if (
      v1Reserve.reason === ReserveReason.Chargeback &&
      v1RawItem?.invoice_id
    ) {
      const found =
        await this.reserveInvoiceRepository.findChargebackReserveByInvoiceId(
          v1RawItem.invoice_id,
        );

      return found;
    }
    if (
      v1Reserve.reason === ReserveReason.ReserveFee &&
      v1RawItem?.invoice_id
    ) {
      const found = await this.reserveInvoiceRepository.findReserveFeeReserve(
        v1RawItem.invoice_id,
      );

      return found;
    }
    return super.getV2Item(v1Reserve, v1RawItem, v2Reserves);
  }
}

export const verifyReservesParity = async (
  masterReport: MasterParityReport,
) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const databaseService = app.get(DatabaseService);
  const reserveBrokerPaymentRepository = app.get(
    ReserveBrokerPaymentRepository,
  );

  const reserveInvoiceRepository = app.get(ReserveInvoiceRepository);

  masterReport.addReport(report);
  await verifyParity<ReserveEntity>({
    path: environment.util.checkAndGetForEnvVariable(
      'SCRIPT_IMPORT_RESERVES_PATH',
    ),
    checker: parityChecker,
    itemProvider: new ReserveItemProvider(
      reserveBrokerPaymentRepository,
      reserveInvoiceRepository,
    ),
    mapperFn: (item) => buildEntity(item),
    dependencies: {
      databaseService,
      repository: app.get(ReserveRepository),
    },
  });
};
