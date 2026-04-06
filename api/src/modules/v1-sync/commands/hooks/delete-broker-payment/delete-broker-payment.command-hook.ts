import { DeleteBrokerPaymentCommand } from '@module-broker-payments/commands';
import { FeatureFlagResolver } from '@module-common';
import { CommandHook } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import { V1Api, retryWithHandledTimeout } from '../../../api';
import { V1SyncCommandHook } from '../v1-sync.command-hook';

@CommandHook(DeleteBrokerPaymentCommand)
export class DeleteBrokerPaymentCommandHook extends V1SyncCommandHook<DeleteBrokerPaymentCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doAfterCommand(
    command: DeleteBrokerPaymentCommand,
  ): Promise<void> {
    await retryWithHandledTimeout(async () => {
      await this.v1Api.deleteBrokerPayment(command.brokerPaymentId);
    });
  }
}
