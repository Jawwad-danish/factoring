import { FeatureFlagResolver } from '@module-common';
import { CommandHook } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import { DeleteProcessingNotesCommand } from '@module-processing-notes';
import { retryWithHandledTimeout, V1Api } from '../../../api';
import { V1SyncCommandHook } from '../v1-sync.command-hook';

@CommandHook(DeleteProcessingNotesCommand)
export class DeleteProcessingNotesCommandHook extends V1SyncCommandHook<DeleteProcessingNotesCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doAfterCommand(
    command: DeleteProcessingNotesCommand,
  ): Promise<void> {
    await retryWithHandledTimeout(async () => {
      await this.v1Api.deleteProcessingNotes(command.id);
    });
  }
}
