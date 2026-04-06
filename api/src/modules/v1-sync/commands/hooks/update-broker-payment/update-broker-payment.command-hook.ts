import { UpdateBrokerPaymentCommand } from '@module-broker-payments/commands';
import { FeatureFlagResolver } from '@module-common';
import { CommandHook } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import { retryWithHandledTimeout, V1Api } from '../../../api';
import { V1SyncCommandHook } from '../v1-sync.command-hook';

@CommandHook(UpdateBrokerPaymentCommand)
export class UpdateBrokerPaymentCommandHook extends V1SyncCommandHook<UpdateBrokerPaymentCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doAfterCommand(
    command: UpdateBrokerPaymentCommand,
  ): Promise<void> {
    if (command.request.v1Payload) {
      await retryWithHandledTimeout(async () => {
        await this.v1Api.updateBrokerPayment(command.brokerPaymentId, {
          ...command.request.v1Payload,
        });
      });
    }
  }
}
