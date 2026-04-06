import { Arrays } from '@core/util';
import { BasicCommandHandler } from '@module-cqrs';
import {
  ClientFactoringConfigsEntity,
  ClientFactoringStatus,
  ClientStatusReason,
  ClientStatusReasonAssocEntity,
  ClientStatusReasonConfigEntity,
} from '@module-persistence/entities';
import { ClientFactoringConfigsRepository } from '@module-persistence/repositories';
import { BasicEntityUtil } from '@module-persistence/util';
import { Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { AuthorityState, LightweightClient } from '../../../../data';
import {
  UpdateClientsFromFmcsaCommand,
  UpdateClientsFromFmcsaResult,
} from '../../update-clients-from-fmcsa.command';

const FMCSA_ISSUE_NOTE = 'FMCSA issue: Per FMCSA site NOT AUTHORIZED';

@CommandHandler(UpdateClientsFromFmcsaCommand)
export class UpdateClientsFromFmcsaCommandHandler
  implements BasicCommandHandler<UpdateClientsFromFmcsaCommand>
{
  private logger: Logger = new Logger(
    UpdateClientsFromFmcsaCommandHandler.name,
  );

  constructor(
    private readonly clientFactoringConfigRepository: ClientFactoringConfigsRepository,
  ) {}

  async execute({
    clients,
  }: UpdateClientsFromFmcsaCommand): Promise<UpdateClientsFromFmcsaResult> {
    const result: UpdateClientsFromFmcsaResult = { changes: [] };
    const factoringConfigs = await this.clientFactoringConfigRepository.find(
      {
        clientId: {
          $in: clients.map((client) => client.id),
        },
      },
      {
        populate: ['statusHistory.clientStatusReasonConfig'],
      },
    );
    for (const factoringConfig of factoringConfigs) {
      const client = clients.find(
        (status) => status.id === factoringConfig.clientId,
      );
      const factoringStatus = factoringConfig.status;
      const fmcsaStatus = this.getStatusToUpdate(factoringConfig, client);
      if (fmcsaStatus == null) {
        continue;
      }

      const historyEntry = this.buildHistoryEntry(fmcsaStatus);
      factoringConfig.status = fmcsaStatus;
      factoringConfig.statusHistory.add(historyEntry);
      result.changes.push({
        clientId: factoringConfig.clientId,
        initialStatus: factoringStatus,
        updatedStatus: fmcsaStatus,
        reason: historyEntry.clientStatusReasonConfig.reason,
      });
    }
    return result;
  }

  private getStatusToUpdate(
    clientFactoringConfig: ClientFactoringConfigsEntity,
    client?: LightweightClient,
  ): null | ClientFactoringStatus {
    if (!client) {
      this.logger.warn(
        'Could not find client factoring config to update status from FMCSA',
        {
          clientId: clientFactoringConfig.clientId,
        },
      );
      return null;
    }

    if (!this.canUpdateStatus(clientFactoringConfig)) {
      this.logger.warn(
        'Skipping status update for client as they dont meet the requirements',
        {
          clientId: clientFactoringConfig.clientId,
          factoringStatus: clientFactoringConfig.status,
        },
      );
      return null;
    }

    const factoringStatus = clientFactoringConfig.status;
    const fmcsaStatus = this.calculateStatusBasedOnFMCSA(
      client.authorityStatus,
      client.allowedToOperate,
    );
    if (fmcsaStatus == null) {
      this.logger.debug(
        'Skipping status update for client as FMCSA status is null',
        {
          clientId: clientFactoringConfig.clientId,
          factoringStatus,
          fmcsaStatus,
        },
      );
      return null;
    }

    if (fmcsaStatus === factoringStatus) {
      this.logger.debug(
        'Skipping status update for client as they are the same',
        {
          clientId: clientFactoringConfig.clientId,
          factoringStatus,
          fmcsaStatus,
        },
      );
      return null;
    }
    return fmcsaStatus;
  }

  private canUpdateStatus(config: ClientFactoringConfigsEntity): boolean {
    if (config.status === ClientFactoringStatus.Active) {
      return true;
    }

    if (
      config.statusHistory.length > 0 &&
      config.status === ClientFactoringStatus.Hold
    ) {
      const sortedEntries = BasicEntityUtil.sortEntitiesAsc(
        config.statusHistory,
      );
      const entriesWithNotes = sortedEntries.filter(
        (statusHistory) => statusHistory.note !== '',
      );
      const lastHistoryEntry =
        entriesWithNotes.length > 0
          ? Arrays.lastItem(entriesWithNotes)
          : sortedEntries[sortedEntries.length - 1];
      if (
        lastHistoryEntry.clientStatusReasonConfig.reason ===
          ClientStatusReason.FMCSAIssues &&
        lastHistoryEntry.clientStatusReasonConfig.status ===
          ClientFactoringStatus.Hold &&
        lastHistoryEntry.note === FMCSA_ISSUE_NOTE
      ) {
        return true;
      }
    }
    return false;
  }

  private calculateStatusBasedOnFMCSA(
    authorityStatus: AuthorityState,
    allowedToOperate: string,
  ): null | ClientFactoringStatus {
    if (
      (authorityStatus === AuthorityState.Active || authorityStatus === null) &&
      allowedToOperate === 'Y'
    ) {
      return ClientFactoringStatus.Active;
    }
    if (
      authorityStatus === AuthorityState.Inactive ||
      allowedToOperate === 'u' ||
      allowedToOperate === 'N'
    ) {
      return ClientFactoringStatus.Hold;
    }
    return null;
  }

  private buildHistoryEntry(
    fmcsaStatus: ClientFactoringStatus,
  ): ClientStatusReasonAssocEntity {
    const reasonConfig = new ClientStatusReasonConfigEntity();
    reasonConfig.reason =
      fmcsaStatus === ClientFactoringStatus.Hold
        ? ClientStatusReason.FMCSAIssues
        : ClientStatusReason.Other;
    reasonConfig.status = fmcsaStatus;

    const history = new ClientStatusReasonAssocEntity();
    history.note =
      fmcsaStatus === ClientFactoringStatus.Hold
        ? FMCSA_ISSUE_NOTE
        : 'Per FMCSA carrier is Authorized';
    history.clientStatusReasonConfig = reasonConfig;
    return history;
  }
}
