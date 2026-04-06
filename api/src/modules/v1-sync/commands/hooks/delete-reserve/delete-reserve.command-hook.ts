import { FeatureFlagResolver } from '@module-common';
import { CommandHook } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import { ReserveEntity, ReserveReason } from '@module-persistence/entities';
import { DeleteReserveCommand } from '@module-reserves/commands';
import { V1Api, retryWithHandledTimeout } from '../../../api';
import { V1SyncCommandHook } from '../v1-sync.command-hook';

const SKIPPABLE_REASONS = [ReserveReason.ChargebackRemoved];

@CommandHook(DeleteReserveCommand)
export class DeleteReserveCommandHook extends V1SyncCommandHook<DeleteReserveCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doAfterCommand(
    command: DeleteReserveCommand,
    result: ReserveEntity,
  ): Promise<void> {
    if (SKIPPABLE_REASONS.includes(result.reason)) {
      return;
    }

    await retryWithHandledTimeout(async () => {
      await this.v1Api.deleteReserve(command.reserveId);
    });
  }
}
