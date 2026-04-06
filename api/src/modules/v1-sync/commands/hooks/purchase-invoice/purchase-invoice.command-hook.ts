import { Duration } from '@core/date-time';
import { FeatureFlagResolver } from '@module-common';
import { CommandHook } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import { PurchaseInvoiceCommand } from '@module-invoices/commands';
import { retryWithHandledTimeout, V1Api } from '../../../api';
import { V1SyncCommandHook } from '../v1-sync.command-hook';

@CommandHook(PurchaseInvoiceCommand)
export class PurchaseInvoiceCommandHook extends V1SyncCommandHook<PurchaseInvoiceCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doAfterCommand(
    command: PurchaseInvoiceCommand,
  ): Promise<void> {
    if (command.request.v1Payload) {
      await retryWithHandledTimeout(
        async () =>
          await this.v1Api.purchaseInvoice(
            command.invoiceId,
            {
              ...command.request.v1Payload,
            },
            {
              timeout: Duration.fromSeconds(30),
            },
          ),
      );
    }
  }
}
