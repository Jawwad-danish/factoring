import { FeatureFlagResolver } from '@module-common';
import { CommandHook } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import { InitiateRegularTransferCommand } from '@module-transfers';
import { V1Api } from '../../../api';
import { V1SyncCommandHook } from '../v1-sync.command-hook';

@CommandHook(InitiateRegularTransferCommand)
export class InitiateRegularTransferCommandHook extends V1SyncCommandHook<InitiateRegularTransferCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doBeforeCommand(
    command: InitiateRegularTransferCommand,
  ): Promise<void> {
    await this.v1Api.initiateRegularTransfer({
      id: command.request.id,
      ...command.request.v1Payload,
    });
  }

  protected async doAfterCommand(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _command: InitiateRegularTransferCommand,
  ): Promise<void> {}
}
