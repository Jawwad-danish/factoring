import { ReleaseClientBrokerAssignmentCommand } from '@module-client-broker-assignments';
import { FeatureFlagResolver } from '@module-common';
import { CommandHook } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import { V1Api } from '../../../api';
import { V1SyncCommandHook } from '../v1-sync.command-hook';

@CommandHook(ReleaseClientBrokerAssignmentCommand)
export class ReleaseClientBrokerAssignmentCommandHook extends V1SyncCommandHook<ReleaseClientBrokerAssignmentCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doAfterCommand(
    command: ReleaseClientBrokerAssignmentCommand,
  ): Promise<void> {
    const v1Assignment = await this.v1Api.getAssignment(
      command.request.clientId,
      command.request.brokerId,
    );

    await this.v1Api.releaseAssignment(
      v1Assignment.id,
      command.request.clientId,
      command.request.brokerId,
    );
  }
}
