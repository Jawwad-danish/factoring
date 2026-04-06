import { CommandHook } from '@module-cqrs';
import { CreateEmployeeCommand } from '@module-users';
import { V1SyncCommandHook } from '../v1-sync.command-hook';
import { FeatureFlagResolver } from '@module-common';
import { DatabaseService } from '@module-database';
import { V1Api } from '../../../api';
import { EmployeeEntity } from '@module-persistence/entities';

@CommandHook(CreateEmployeeCommand)
export class CreateEmployeeCommandHook extends V1SyncCommandHook<CreateEmployeeCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doAfterCommand(
    command: CreateEmployeeCommand,
    result: EmployeeEntity,
  ): Promise<void> {
    if (command.request.v1Payload) {
      await this.v1Api.createEmployee({
        ...command.request.v1Payload,
        id: result.id,
        user_id: result.user.id,
        keepOriginalID: true,
      });
    }
  }
}
