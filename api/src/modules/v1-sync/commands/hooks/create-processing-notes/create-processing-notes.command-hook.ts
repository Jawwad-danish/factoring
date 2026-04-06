import { FeatureFlagResolver } from '@module-common';
import { CommandHook } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import {
  ProcessingNotesEntity,
  ProcessingNotesStatus,
} from '@module-persistence';
import { CreateProcessingNotesCommand } from '@module-processing-notes';
import { retryWithHandledTimeout, V1Api } from '../../../api';
import { V1SyncCommandHook } from '../v1-sync.command-hook';

@CommandHook(CreateProcessingNotesCommand)
export class CreateProcessingNotesCommandHook extends V1SyncCommandHook<CreateProcessingNotesCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doAfterCommand(
    _command: CreateProcessingNotesCommand,
    result: ProcessingNotesEntity,
  ): Promise<void> {
    const type = result.clientId ? 'client' : 'debtor';
    await retryWithHandledTimeout(async () => {
      await this.v1Api.createProcessingNotes({
        client_id: result.clientId,
        debtor_id: result.brokerId,
        notes: result.notes,
        status:
          result.status === ProcessingNotesStatus.Active
            ? 'active'
            : 'archived',
        type: type,
        id: result.id,
        keepOriginalID: true,
      });
    });
  }
}
