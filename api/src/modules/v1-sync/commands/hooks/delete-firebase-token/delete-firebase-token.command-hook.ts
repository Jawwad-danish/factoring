import { CommandHook } from '@module-cqrs';
import { V1SyncCommandHook } from '../v1-sync.command-hook';
import { FeatureFlagResolver } from '@module-common';
import { DatabaseService } from '@module-database';
import { retryWithHandledTimeout, V1Api } from '../../../api';
import { DeleteFirebaseTokenCommand } from '@module-firebase';

@CommandHook(DeleteFirebaseTokenCommand)
export class DeleteFirebaseTokenCommandHook extends V1SyncCommandHook<DeleteFirebaseTokenCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doAfterCommand(
    command: DeleteFirebaseTokenCommand,
  ): Promise<void> {
    await retryWithHandledTimeout(async () => {
      await this.v1Api.deleteFirebaseToken(command.token);
    });
  }
}
