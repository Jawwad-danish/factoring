import { MarkBankAccountAsPrimaryCommand } from '@module-clients/commands';
import { FeatureFlagResolver } from '@module-common';
import { CommandHook } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import { retryWithHandledTimeout, V1Api } from '../../../api';
import { V1SyncCommandHook } from '../v1-sync.command-hook';

@CommandHook(MarkBankAccountAsPrimaryCommand)
export class MarkBankAccountAsPrimaryCommandHook extends V1SyncCommandHook<MarkBankAccountAsPrimaryCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doAfterCommand(
    command: MarkBankAccountAsPrimaryCommand,
  ): Promise<void> {
    await retryWithHandledTimeout(async () => {
      const v1Payload = {
        status: 'active',
        skip_sync: true, // skip_sync is used to prevent syncing v1 -> client service because we are updating the client service
        client_id: command.clientId,
      };
      await this.v1Api.updateBankAccount(command.bankAccountId, v1Payload);
    });
  }
}
