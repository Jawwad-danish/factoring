import { FeatureFlagResolver } from '@module-common';
import { CommandHook } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import { RegenerateInvoiceDocumentCommand } from '@module-invoices/commands';
import { V1Api } from '../../../api';
import { V1SyncCommandHook } from '../v1-sync.command-hook';

@CommandHook(RegenerateInvoiceDocumentCommand)
export class RegenerateInvoiceDocumentCommandHook extends V1SyncCommandHook<RegenerateInvoiceDocumentCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doAfterCommand(
    command: RegenerateInvoiceDocumentCommand,
  ): Promise<void> {
    await this.v1Api.regenerateInvoiceDocument(command.invoiceId);
  }
}
