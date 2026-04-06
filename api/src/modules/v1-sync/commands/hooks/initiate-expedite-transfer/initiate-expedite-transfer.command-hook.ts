import { Duration } from '@core/date-time';
import { FeatureFlagResolver } from '@module-common';
import { CommandHook } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import { InitiateExpediteTransferCommand } from '@module-transfers';
import { V1Api, retryWithHandledTimeout } from '../../../api';
import { V1SyncCommandHook } from '../v1-sync.command-hook';
@CommandHook(InitiateExpediteTransferCommand)
export class InitiateExpediteTransferCommandHook extends V1SyncCommandHook<InitiateExpediteTransferCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doAfterCommand(
    command: InitiateExpediteTransferCommand,
  ): Promise<void> {
    if (command.request.v1Payload) {
      await retryWithHandledTimeout(() =>
        this.v1Api.initiateExpediteTransfer(
          command.request.clientId,
          {
            useTransfersApi: true,
            id: command.request.id || command.getResult()?.id,
            ...command.request.v1Payload,
          },
          {
            timeout: Duration.fromSeconds(30),
          },
        ),
      );
    }
  }
}
