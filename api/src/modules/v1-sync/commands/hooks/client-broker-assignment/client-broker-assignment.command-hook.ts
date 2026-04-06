import { CreateClientBrokerAssignmentCommand } from '@module-client-broker-assignments';
import { CommandHook } from '@module-cqrs';
import { V1SyncCommandHook } from '../v1-sync.command-hook';
import { FeatureFlagResolver } from '@module-common';
import { DatabaseService } from '@module-database';
import { retryWithHandledTimeout, V1Api } from '../../../api';

@CommandHook(CreateClientBrokerAssignmentCommand)
export class CreateClientBrokerAssignmentCommandHook extends V1SyncCommandHook<CreateClientBrokerAssignmentCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doAfterCommand(
    command: CreateClientBrokerAssignmentCommand,
  ): Promise<void> {
    if (command.request.v1Payload) {
      await retryWithHandledTimeout(async () => {
        await this.v1Api.createClientDebtorAssignment({
          ...command.request.v1Payload,
        });
      });
    }
  }
}
