import { FeatureFlagResolver } from '@module-common';
import { CommandHook } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import { DeleteInvoiceActivityCommand } from '@module-invoices/commands';
import { V1Api } from '../../../api';
import { V1SyncCommandHook } from '../v1-sync.command-hook';
import { ActivityLogRepository, TagDefinitionKey } from '@module-persistence';
import { getV1InvoiceUpdateFromActivityLog } from '../../../data/invoice-updates-to-activity-log.mapper';

@CommandHook(DeleteInvoiceActivityCommand)
export class DeleteInvoiceTagCommandHook extends V1SyncCommandHook<DeleteInvoiceActivityCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly activityLogRepository: ActivityLogRepository,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doAfterCommand(
    command: DeleteInvoiceActivityCommand,
  ): Promise<void> {
    let invoiceUpdateId =
      command.request.v1Payload?.['invoice_update_id'] || command.activityId;
    if (!invoiceUpdateId) {
      throw new Error(
        'Invoice update id is required to delete invoice update from v1',
      );
    }
    const activityLog = await this.activityLogRepository.findOneById(
      invoiceUpdateId,
    );

    // This tag may be computed automatically on our side so it's possible it doesn't exist on v1
    if (
      activityLog?.tagDefinition.key ===
      TagDefinitionKey.POSSIBLE_DUPLICATE_INVOICE
    ) {
      const v1Update = await this.findInvoiceUpdate(invoiceUpdateId);

      if (!v1Update) {
        this.logger.warn(
          `Skipping deletion of invoice update ${invoiceUpdateId} as it doesn't exist on V1`,
          {
            invoiceUpdateId,
          },
        );
        return;
      }

      invoiceUpdateId = v1Update.id;
    }

    await this.v1Api.deleteInvoiceUpdate(
      invoiceUpdateId,
      activityLog
        ? {
            update_status: getV1InvoiceUpdateFromActivityLog(
              activityLog.tagDefinition.key,
            ),
            invoice_id: command.invoiceId,
          }
        : undefined,
    );
  }

  private async findInvoiceUpdate(
    invoiceUpdateId: string,
  ): Promise<any | null> {
    try {
      return await this.v1Api.getInvoiceUpdate(invoiceUpdateId);
    } catch (error) {
      this.logger.error(
        `Could not find invoice update with id ${invoiceUpdateId} in V1 for deletion`,
        {
          invoiceUpdateId,
          errorMessage: error.message,
        },
      );
      return null;
    }
  }
}
