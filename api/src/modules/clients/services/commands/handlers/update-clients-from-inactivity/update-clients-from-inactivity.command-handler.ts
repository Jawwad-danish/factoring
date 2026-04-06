import { BasicCommandHandler } from '@module-cqrs';
import {
  ClientFactoringConfigsRepository,
  ClientFactoringStatus,
  ClientStatusReason,
  ClientStatusReasonAssocEntity,
  ClientStatusReasonConfigEntity,
} from '@module-persistence';
import { CommandHandler } from '@nestjs/cqrs';
import dayjs from 'dayjs';
import {
  UpdateClientsFromInactivityCommand,
  UpdateClientsFromInactivityResult,
} from '../../update-client-config-status.command';

@CommandHandler(UpdateClientsFromInactivityCommand)
export class UpdateClientsFromInactivityCommandHandler
  implements BasicCommandHandler<UpdateClientsFromInactivityCommand>
{
  constructor(private readonly repository: ClientFactoringConfigsRepository) {}

  async execute(): Promise<UpdateClientsFromInactivityResult> {
    const result: UpdateClientsFromInactivityResult = { changes: [] };
    const configs =
      await this.repository.get90DaysInactiveClientFactoringConfigs();

    if (!configs.length) {
      return result;
    }

    for (const config of configs) {
      if (config.status === ClientFactoringStatus.Hold) {
        continue;
      }
      const currentStatus = config.status;
      config.status = ClientFactoringStatus.Hold;
      config.statusHistory.add(this.buildHistoryEntry());
      result.changes.push({
        clientId: config.clientId,
        initialStatus: currentStatus,
        updatedStatus: config.status,
        reason: ClientStatusReason.Inactivity,
      });
    }
    return result;
  }

  private buildHistoryEntry(): ClientStatusReasonAssocEntity {
    const reasonConfig = new ClientStatusReasonConfigEntity();
    reasonConfig.reason = ClientStatusReason.Inactivity;
    reasonConfig.status = ClientFactoringStatus.Hold;
    const history = new ClientStatusReasonAssocEntity();
    history.note = `Client has not submitted invoices since ${dayjs()
      .subtract(90, 'day')
      .format('M/D/YYYY')}`;
    history.clientStatusReasonConfig = reasonConfig;
    return history;
  }
}
