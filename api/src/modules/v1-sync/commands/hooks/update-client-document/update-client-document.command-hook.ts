import { UpdateClientDocumentCommand } from '@module-clients';
import { FeatureFlagResolver } from '@module-common';
import { CommandHook } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import { retryWithHandledTimeout, V1Api } from '../../../api';
import { V1SyncCommandHook } from '../v1-sync.command-hook';
import { Duration } from '@core/date-time';

@CommandHook(UpdateClientDocumentCommand)
export class UpdateClientDocumentCommandHook extends V1SyncCommandHook<UpdateClientDocumentCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doAfterCommand(
    command: UpdateClientDocumentCommand,
  ): Promise<void> {
    const document = await this.v1Api.getClientDocument(command.documentId);
    const updatedDocument = {
      ...document,
      url: command.request.internalUrl,
      updated_by: command.request.updatedBy,
    };

    if (!command.request.id) {
      command.request.id = command.documentId;
    }
    if (command.request.v1Payload) {
      await retryWithHandledTimeout(
        async () =>
          await this.v1Api.updateClientDocument(
            document.id,
            {
              ...updatedDocument,
            },
            {
              timeout: Duration.fromSeconds(30),
            },
          ),
      );
    }
  }
}
