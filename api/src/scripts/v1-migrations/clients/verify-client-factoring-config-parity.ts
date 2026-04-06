import { environment } from '@core/environment';
import { Collection } from '@mikro-orm/core';
import { DatabaseService } from '@module-database';
import {
  ClientFactoringConfigsEntity,
  ClientFactoringRateReasonAssocEntity,
  ClientFactoringRateReasonEntity,
  ClientReserveRateReasonAssocEntity,
  ClientReserveRateReasonEntity,
  ClientStatusReasonAssocEntity,
  ClientStatusReasonConfigEntity,
} from '@module-persistence/entities';
import {
  ClientFactoringConfigsRepository,
  ClientFactoringRateReasonRepository,
  ClientReserveRateReasonRepository,
  ClientStatusReasonConfigRepository,
} from '@module-persistence/repositories';
import { NestFactory } from '@nestjs/core';
import { ParityItemProvider } from 'src/scripts/util/parity/parity-item-provider';
import { AppModule } from '../../../modules/app/app.module';
import {
  FieldDifference,
  FieldEqualityManager,
  MasterParityReport,
  ParityChecker,
  ParityReport,
  verifyParity,
} from '../../util/parity';
import {
  addFactoringRateHistory,
  addReserveRateHistory,
  addStatusHistory,
  buildClientFactoringConfig,
  getFactoringRateReasons,
  getReserveRateReasons,
  getStatusReasons,
} from './client-factoring-config/client-factoring-config-mapper';

const report = new ParityReport<ClientFactoringConfigsEntity>(
  'client-factoring-config',
  'clientId',
  true,
);

class FactoringRateHistoryEqualityManager extends FieldEqualityManager<ClientFactoringConfigsEntity> {
  constructor() {
    super('factoringRateHistory');
  }
  areFieldsEqual(
    v1Entity: ClientFactoringConfigsEntity,
    v2Entity: ClientFactoringConfigsEntity,
  ): boolean {
    if (
      v1Entity.factoringRateHistory.length !==
      v2Entity.factoringRateHistory.length
    ) {
      return false;
    }
    const v1Items = v1Entity.factoringRateHistory
      .getItems()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const v2Items = v2Entity.factoringRateHistory
      .getItems()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    for (let i = 0; i < v1Items.length; i++) {
      const v1History = v1Items[i];
      const v2History = v2Items[i];
      if (!this.areHistoryFieldsEqual(v1History, v2History)) {
        return false;
      }
    }
    return true;
  }

  private areHistoryFieldsEqual(
    v1HistoryField: ClientFactoringRateReasonAssocEntity,
    v2HistoryField: ClientFactoringRateReasonAssocEntity,
  ): boolean {
    return [
      new FieldEqualityManager<ClientFactoringRateReasonEntity>(
        'reason',
      ).areFieldsEqual(v1HistoryField.reason, v2HistoryField.reason),
      new FieldEqualityManager<ClientFactoringRateReasonAssocEntity>(
        'factoringRatePercentage',
      ).areFieldsEqual(v1HistoryField, v2HistoryField),
      new FieldEqualityManager<ClientFactoringRateReasonAssocEntity>(
        'note',
      ).areFieldsEqual(v1HistoryField, v2HistoryField),
    ].every((result) => result === true);
  }
}
class ReserveRateHistoryEqualityManager extends FieldEqualityManager<ClientFactoringConfigsEntity> {
  constructor() {
    super('reserveRateHistory');
  }
  areFieldsEqual(
    v1Entity: ClientFactoringConfigsEntity,
    v2Entity: ClientFactoringConfigsEntity,
  ): boolean {
    if (
      v1Entity.reserveRateHistory.length !== v2Entity.reserveRateHistory.length
    ) {
      return false;
    }
    const v1Items = v1Entity.reserveRateHistory
      .getItems()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const v2Items = v2Entity.reserveRateHistory
      .getItems()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    for (let i = 0; i < v1Items.length; i++) {
      const v1History = v1Items[i];
      const v2History = v2Items[i];
      if (!this.areHistoryFieldsEqual(v1History, v2History)) {
        return false;
      }
    }
    return true;
  }

  private areHistoryFieldsEqual(
    v1HistoryField: ClientReserveRateReasonAssocEntity,
    v2HistoryField: ClientReserveRateReasonAssocEntity,
  ): boolean {
    return [
      new FieldEqualityManager<ClientReserveRateReasonEntity>(
        'reason',
      ).areFieldsEqual(
        v1HistoryField.reserveRateReason,
        v2HistoryField.reserveRateReason,
      ),
      new FieldEqualityManager<ClientReserveRateReasonAssocEntity>(
        'reserveRatePercentage',
      ).areFieldsEqual(v1HistoryField, v2HistoryField),
      new FieldEqualityManager<ClientReserveRateReasonAssocEntity>(
        'note',
      ).areFieldsEqual(v1HistoryField, v2HistoryField),
    ].every((result) => result === true);
  }
}
class StatusHistoryEqualityManager extends FieldEqualityManager<ClientFactoringConfigsEntity> {
  constructor() {
    super('statusHistory');
  }
  areFieldsEqual(
    v1Entity: ClientFactoringConfigsEntity,
    v2Entity: ClientFactoringConfigsEntity,
  ): boolean {
    if (v1Entity.statusHistory.length !== v2Entity.statusHistory.length) {
      return false;
    }
    const v1Items = v1Entity.statusHistory
      .getItems()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const v2Items = v2Entity.statusHistory
      .getItems()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    for (let i = 0; i < v1Items.length; i++) {
      const v1History = v1Items[i];
      const v2History = v2Items[i];
      if (!this.areHistoryFieldsEqual(v1History, v2History)) {
        return false;
      }
    }
    return true;
  }

  private areHistoryFieldsEqual(
    v1HistoryField: ClientStatusReasonAssocEntity,
    v2HistoryField: ClientStatusReasonAssocEntity,
  ): boolean {
    return [
      new FieldEqualityManager<ClientStatusReasonConfigEntity>(
        'status',
      ).areFieldsEqual(
        v1HistoryField.clientStatusReasonConfig,
        v2HistoryField.clientStatusReasonConfig,
      ),
      new FieldEqualityManager<ClientStatusReasonConfigEntity>(
        'reason',
      ).areFieldsEqual(
        v1HistoryField.clientStatusReasonConfig,
        v2HistoryField.clientStatusReasonConfig,
      ),
      new FieldEqualityManager<ClientStatusReasonAssocEntity>(
        'note',
      ).areFieldsEqual(v1HistoryField, v2HistoryField),
    ].every((result) => result === true);
  }
}

const parityChecker = new ParityChecker<ClientFactoringConfigsEntity>(
  [
    new FieldEqualityManager('factoringRatePercentage'),
    new FieldEqualityManager('verificationPercentage'),
    new FieldEqualityManager('vip'),
    new FieldEqualityManager('status'),
    new FactoringRateHistoryEqualityManager(),
    new ReserveRateHistoryEqualityManager(),
    new StatusHistoryEqualityManager(),
  ],
  report,
  undefined,
  differenceValueMapper,
);

function differenceValueMapper(
  difference: FieldDifference<ClientFactoringConfigsEntity>,
): any {
  const results: any[] = [];
  switch (difference.key) {
    case 'statusHistory':
      const v1StatusAssocEntities = (
        difference.v1Value as Collection<ClientStatusReasonAssocEntity>
      ).getItems();
      const v2StatusAssocEntities = (
        difference.v2Value as Collection<ClientStatusReasonAssocEntity>
      ).getItems();
      if (v1StatusAssocEntities.length !== v2StatusAssocEntities.length) {
        results.push({
          key: 'statusHistoryCount',
          v1Value: v1StatusAssocEntities.length,
          v2Value: v2StatusAssocEntities.length,
        });
        return results;
      }
      for (let index = 0; index < v1StatusAssocEntities.length; index++) {
        results.push({
          key: difference.key,
          v1Value: {
            status:
              v1StatusAssocEntities[index].clientStatusReasonConfig.status,
            reason:
              v1StatusAssocEntities[index].clientStatusReasonConfig.reason,
            note: v1StatusAssocEntities[index].note,
          },
          v2Value: {
            status:
              v2StatusAssocEntities[index].clientStatusReasonConfig.status,
            reason:
              v2StatusAssocEntities[index].clientStatusReasonConfig.reason,
            note: v2StatusAssocEntities[index].note,
          },
        });
      }
      return results;
    case 'reserveRateHistory':
      const v1ReserveAssocEntities = (
        difference.v1Value as Collection<ClientReserveRateReasonAssocEntity>
      ).getItems();
      const v2ReserveAssocEntities = (
        difference.v2Value as Collection<ClientReserveRateReasonAssocEntity>
      ).getItems();
      if (v1ReserveAssocEntities.length !== v2ReserveAssocEntities.length) {
        results.push({
          key: 'reserveHistoryCount',
          v1Value: v1ReserveAssocEntities.length,
          v2Value: v2ReserveAssocEntities.length,
        });
        return results;
      }
      for (let index = 0; index < v1ReserveAssocEntities.length; index++) {
        results.push({
          key: difference.key,
          v1Value: {
            reserveRatePercentage:
              v1ReserveAssocEntities[index].reserveRatePercentage,
            reason: v1ReserveAssocEntities[index].reserveRateReason.reason,
            note: v1ReserveAssocEntities[index].note,
          },
          v2Value: {
            reserveRatePercentage:
              v2ReserveAssocEntities[index].reserveRatePercentage,
            reason: v2ReserveAssocEntities[index].reserveRateReason.reason,
            note: v2ReserveAssocEntities[index].note,
          },
        });
      }
      return results;
    case 'factoringRateHistory':
      const v1FactoringAssocEntities = (
        difference.v1Value as Collection<ClientFactoringRateReasonAssocEntity>
      ).getItems();
      const v2FactoringAssocEntities = (
        difference.v2Value as Collection<ClientFactoringRateReasonAssocEntity>
      ).getItems();
      if (v1FactoringAssocEntities.length !== v2FactoringAssocEntities.length) {
        results.push({
          key: 'factoringHistoryCount',
          v1Value: v1FactoringAssocEntities.length,
          v2Value: v2FactoringAssocEntities.length,
        });
        return results;
      }
      for (let index = 0; index < v1FactoringAssocEntities.length; index++) {
        results.push({
          key: difference.key,
          v1Value: {
            factoringRatePercentage:
              v1FactoringAssocEntities[index].factoringRatePercentage,
            reason: v1FactoringAssocEntities[index].reason.reason,
            note: v1FactoringAssocEntities[index].note,
          },
          v2Value: {
            factoringRatePercentage:
              v2FactoringAssocEntities[index].factoringRatePercentage,
            reason: v2FactoringAssocEntities[index].reason.reason,
            note: v2FactoringAssocEntities[index].note,
          },
        });
      }
      return results;
    default:
      return difference;
  }
}

class ClientFactoringConfigItemProvider extends ParityItemProvider<ClientFactoringConfigsEntity> {
  retrieveV2Entities(
    repository: ClientFactoringConfigsRepository,
    v1Items: ClientFactoringConfigsEntity[],
  ): Promise<ClientFactoringConfigsEntity[]> {
    return repository.findByClientIds(
      v1Items.map((item) => item.clientId),
      { history: true, audit: false, user: false },
    );
  }

  async getV2Item(
    v1Item: ClientFactoringConfigsEntity,
    _rawV1Item: any,
    v2Items: ClientFactoringConfigsEntity[],
  ): Promise<ClientFactoringConfigsEntity | null> {
    return v2Items.find((item) => item.clientId === v1Item.clientId) || null;
  }

  async getV1Item(
    rawV1Item: any,
    v1Items: ClientFactoringConfigsEntity[],
  ): Promise<ClientFactoringConfigsEntity | null> {
    return v1Items.find((item) => item.clientId === rawV1Item.id) || null;
  }
}

export const verifyClientFactoringParity = async (
  masterReport: MasterParityReport,
) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const databaseService = app.get(DatabaseService);

  const clientFactoringRateReasonRepository = app.get(
    ClientFactoringRateReasonRepository,
  );

  const clientReserveRateReasonRepository = app.get(
    ClientReserveRateReasonRepository,
  );

  const clientStatusReasonConfigRepository = app.get(
    ClientStatusReasonConfigRepository,
  );

  const factoringRateReasons = await getFactoringRateReasons(
    databaseService,
    clientFactoringRateReasonRepository,
  );

  const reserveRateReasons = await getReserveRateReasons(
    databaseService,
    clientReserveRateReasonRepository,
  );

  const statusReasons = await getStatusReasons(
    databaseService,
    clientStatusReasonConfigRepository,
  );

  masterReport.addReport(report);
  await verifyParity<ClientFactoringConfigsEntity>({
    path: environment.util.checkAndGetForEnvVariable(
      'SCRIPT_IMPORT_CLIENTS_DATA_PATH',
    ),
    checker: parityChecker,
    itemProvider: new ClientFactoringConfigItemProvider(),
    mapperFn: (item, em) => {
      const entity = buildClientFactoringConfig(item);
      addFactoringRateHistory(entity, item, em, factoringRateReasons[0]);
      addReserveRateHistory(entity, item, em, reserveRateReasons[0]);
      addStatusHistory(entity, item, em, statusReasons[0]);
      return entity;
    },

    dependencies: {
      databaseService,
      repository: app.get(ClientFactoringConfigsRepository),
    },
  });
};
