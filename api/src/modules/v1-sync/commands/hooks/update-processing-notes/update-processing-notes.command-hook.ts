import { FeatureFlagResolver } from '@module-common';
import { CommandHook } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import {
  ProcessingNotesEntity,
  ProcessingNotesStatus,
} from '@module-persistence';
import { UpdateProcessingNotesCommand } from '@module-processing-notes';
import { retryWithHandledTimeout, V1Api } from '../../../api';
import { V1SyncCommandHook } from '../v1-sync.command-hook';

@CommandHook(UpdateProcessingNotesCommand)
export class UpdateProcessingNotesCommandHook extends V1SyncCommandHook<UpdateProcessingNotesCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doAfterCommand(
    command: UpdateProcessingNotesCommand,
    result: ProcessingNotesEntity,
  ): Promise<void> {
    const type = result.clientId ? 'client' : 'debtor';
    await retryWithHandledTimeout(async () => {
      await this.v1Api.updateProcessingNotes(command.id, {
        client_id: result.clientId,
        debtor_id: result.brokerId,
        notes: result.notes,
        id: command.id,
        type: type,
        status:
          result.status === ProcessingNotesStatus.Active
            ? 'active'
            : 'archived',
      });
    });
  }
}
