import { CauseAwareError } from '@core/errors';
import { UpdateBuyoutCommand } from '@module-buyouts';
import { FeatureFlagResolver } from '@module-common';
import { CommandHook } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import { PendingBuyoutEntity } from '@module-persistence/entities';
import { Logger } from '@nestjs/common';
import { V1Api, retryWithHandledTimeout } from '../../../api';
import { V1SyncCommandHook } from '../v1-sync.command-hook';

@CommandHook(UpdateBuyoutCommand)
export class UpdateBuyoutCommandHook extends V1SyncCommandHook<
  UpdateBuyoutCommand,
  PendingBuyoutEntity
> {
  readonly logger = new Logger(UpdateBuyoutCommandHook.name);

  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doAfterCommand(
    command: UpdateBuyoutCommand,
    result: PendingBuyoutEntity,
  ): Promise<void> {
    try {
      await retryWithHandledTimeout(async () => {
        await this.v1Api.updateBuyout(command.id, {
          id: result.id,
          client_id: result.clientId,
          load_number: result.loadNumber,
          mc: result.brokerMC,
          rate: result.rate.toNumber(),
          buyout_invoice_date: result.paymentDate.toISOString(),
          debtor_name: result.brokerName,
          keepOriginalID: true,
        });
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: any): void {
    this.logger.error('Error while updating buyout', error);
    throw new CauseAwareError('Error while updating buyout', error);
  }
}
