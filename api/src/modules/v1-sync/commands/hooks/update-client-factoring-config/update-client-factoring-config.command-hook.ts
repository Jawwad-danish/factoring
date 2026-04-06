import { UpdateClientFactoringConfigCommand } from '@module-clients/commands';
import { FeatureFlagResolver } from '@module-common';
import { CommandHook } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import { ClientFactoringConfigsEntity } from '../../../../persistence';
import { V1Api } from '../../../api';
import { V1SyncCommandHook } from '../v1-sync.command-hook';

@CommandHook(UpdateClientFactoringConfigCommand)
export class UpdateClientFactoringConfigCommandHook extends V1SyncCommandHook<UpdateClientFactoringConfigCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doAfterCommand(
    command: UpdateClientFactoringConfigCommand,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _result: ClientFactoringConfigsEntity,
  ): Promise<void> {
    if (command.request.v1Payload) {
      await this.v1Api.updateClient(command.clientId, {
        ...command.request.v1Payload,
        id: command.clientId,
      });
    }
  }
}
