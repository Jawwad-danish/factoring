import { FeatureFlagResolver } from '@module-common';
import { CommandHook } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import { ReserveEntity } from '@module-persistence/entities';
import { CreateReserveCommand } from '@module-reserves/commands';
import { V1Api, retryWithHandledTimeout } from '../../../api';
import { V1SyncCommandHook } from '../v1-sync.command-hook';

@CommandHook(CreateReserveCommand)
export class CreateReserveCommandHook extends V1SyncCommandHook<CreateReserveCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doAfterCommand(
    command: CreateReserveCommand,
    result: ReserveEntity,
  ): Promise<void> {
    if (command.request.v1Payload) {
      await retryWithHandledTimeout(async () => {
        await this.v1Api.createReserve({
          ...command.request.v1Payload,
          id: result.id,
          keepOriginalID: true,
        });
      });
    }
  }
}
