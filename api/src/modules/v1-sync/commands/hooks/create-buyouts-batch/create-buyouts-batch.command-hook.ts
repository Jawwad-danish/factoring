import { CauseAwareError } from '@core/errors';
import { CreateBuyoutsBatchCommand } from '@module-buyouts';
import { FeatureFlagResolver } from '@module-common';
import { CommandHook } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import { PendingBuyoutsBatchEntity } from '@module-persistence/entities';
import { V1Api, retryWithHandledTimeout } from '../../../api';
import { V1SyncCommandHook } from '../v1-sync.command-hook';

@CommandHook(CreateBuyoutsBatchCommand)
export class CreateBuyoutsBatchCommandHook extends V1SyncCommandHook<CreateBuyoutsBatchCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doAfterCommand(
    command: CreateBuyoutsBatchCommand,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _result: PendingBuyoutsBatchEntity,
  ): Promise<void> {
    try {
      await retryWithHandledTimeout(async () => {
        await this.v1Api.createBuyoutsBatch({
          ...command.request.v1Payload,
        });
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: any): void {
    this.logger.error('Error while creating buyouts batch', error);
    throw new CauseAwareError('Error while creating buyouts batch', error);
  }
}
