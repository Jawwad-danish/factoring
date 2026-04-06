import { Duration } from '@core/date-time';
import { FeatureFlagResolver } from '@module-common';
import { CommandHook } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import { DeleteInvoiceCommand } from '@module-invoices/commands';
import { retryWithHandledTimeout, V1Api } from '../../../api';
import { V1SyncCommandHook } from '../v1-sync.command-hook';

@CommandHook(DeleteInvoiceCommand)
export class DeleteInvoiceCommandHook extends V1SyncCommandHook<DeleteInvoiceCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doAfterCommand(command: DeleteInvoiceCommand): Promise<void> {
    await retryWithHandledTimeout(
      async () =>
        await this.v1Api.deleteInvoice(command.invoiceId, {
          timeout: Duration.fromSeconds(30),
        }),
    );
  }
}
