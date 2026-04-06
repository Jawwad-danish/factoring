import { DeleteBuyoutCommand } from '@module-buyouts/commands';
import { FeatureFlagResolver } from '@module-common';
import { CommandHook } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import { V1Api, retryWithHandledTimeout } from '../../../api';
import { V1SyncCommandHook } from '../v1-sync.command-hook';

@CommandHook(DeleteBuyoutCommand)
export class DeleteBuyoutCommandHook extends V1SyncCommandHook<DeleteBuyoutCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doAfterCommand(command: DeleteBuyoutCommand): Promise<void> {
    await retryWithHandledTimeout(async () => {
      await this.v1Api.deleteBuyout(command.buyoutId);
    });
  }
}
