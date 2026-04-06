import { FeatureFlagResolver } from '@module-common';
import { CommandHook } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import {
  InitiateDebitRegularTransferCommand,
  InitiateRegularTransferCommand,
} from '@module-transfers';
import { V1Api } from '../../../api';
import { V1SyncCommandHook } from '../v1-sync.command-hook';

@CommandHook(InitiateDebitRegularTransferCommand)
export class InitiateDebitRegularTransferCommandHook extends V1SyncCommandHook<InitiateRegularTransferCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doAfterCommand(
    command: InitiateDebitRegularTransferCommand,
  ): Promise<void> {
    if (command.request.v1Payload) {
      await this.v1Api.initiateDebitTransfer({
        id: command.request.id || command.getResult()?.id,
        ...command.request.v1Payload,
      });
    }
  }
}
