import { FeatureFlagResolver } from '@module-common';
import { CommandHook } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import { ReserveAccountFundsEntity } from '@module-persistence/entities';
import { CreateReserveAccountFundsCommand } from '@module-reserve-account-funds';
import { V1Api } from '../../../api';
import { V1SyncCommandHook } from '../v1-sync.command-hook';

@CommandHook(CreateReserveAccountFundsCommand)
export class CreateReserveAccountFundsCommandHook extends V1SyncCommandHook<CreateReserveAccountFundsCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doAfterCommand(
    command: CreateReserveAccountFundsCommand,
    result: ReserveAccountFundsEntity,
  ): Promise<void> {
    if (command.request.v1Payload) {
      await this.v1Api.createReserveAccountFunds({
        ...command.request.v1Payload,
        id: result.id,
        keepOriginalID: true,
      });
    }
  }
}
