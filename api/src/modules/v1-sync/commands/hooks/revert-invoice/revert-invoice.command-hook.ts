import { FeatureFlagResolver } from '@module-common';
import { CommandHook } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import { RevertInvoiceCommand } from '@module-invoices/commands';
import { retryWithHandledTimeout, V1Api } from '../../../api';
import { V1SyncCommandHook } from '../v1-sync.command-hook';

@CommandHook(RevertInvoiceCommand)
export class RevertInvoiceCommandHook extends V1SyncCommandHook<RevertInvoiceCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doAfterCommand(command: RevertInvoiceCommand): Promise<void> {
    const v1Payload = {
      approved_date: null,
      id: command.invoiceId,
      paid_date: null,
      status: 'pending',
    };

    await retryWithHandledTimeout(async () => {
      await this.v1Api.revertInvoice(command.invoiceId, v1Payload);
    });
  }
}
