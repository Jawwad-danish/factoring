import { FeatureFlagResolver } from '@module-common';
import { CommandHook } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import { RejectInvoiceCommand } from '@module-invoices/commands';
import { retryWithHandledTimeout, V1Api } from '../../../api';
import { V1SyncCommandHook } from '../v1-sync.command-hook';

@CommandHook(RejectInvoiceCommand)
export class RejectInvoiceCommandHook extends V1SyncCommandHook<RejectInvoiceCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doAfterCommand(command: RejectInvoiceCommand): Promise<void> {
    if (command.request.v1Payload) {
      await retryWithHandledTimeout(async () => {
        await this.v1Api.rejectInvoice(command.invoiceId, {
          ...command.request.v1Payload,
        });
      });
    }
  }
}
