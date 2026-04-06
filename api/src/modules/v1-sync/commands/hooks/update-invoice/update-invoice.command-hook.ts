import { FeatureFlagResolver } from '@module-common';
import { CommandHook } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import { UpdateInvoiceCommand } from '@module-invoices/commands';
import { retryWithHandledTimeout, V1Api } from '../../../api';
import { V1SyncCommandHook } from '../v1-sync.command-hook';
import { CommandInvoiceContext, UpdateInvoiceRequest } from '@module-invoices';
import { VerificationStatus } from '@module-persistence';
import { Duration } from '@core/date-time';

export enum InvoiceDocumentLabelMapping {
  'rate_of_confirmation' = 'Rate Confirmation',
  'bill_of_landing' = 'Bill of Lading',
  'lumper_receipt' = 'Lumper Receipt',
  'scale_ticket' = 'Scale Ticket',
  'other' = 'Other',
}

@CommandHook(UpdateInvoiceCommand)
export class UpdateInvoiceCommandHook extends V1SyncCommandHook<UpdateInvoiceCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doAfterCommand(
    command: UpdateInvoiceCommand,
    result: CommandInvoiceContext<UpdateInvoiceRequest>,
  ): Promise<void> {
    const requiresVerification = [VerificationStatus.Required].includes(
      result.entity.verificationStatus,
    );

    if (command.request.v1Payload) {
      if (!command.request.v1Payload?.['notes'] && command.request.documents) {
        let notes = '';
        for (const document of command.request.documents.toAdd) {
          notes += `Added document ${document.name}. `;
        }
        for (const document of command.request.documents.toDelete) {
          const found = command
            .getResult()
            ?.entity.documents.find((e) => e.id === document);
          if (found) {
            notes += `Removed document ${found.name}. `;
          }
        }
        (command.request.v1Payload as any).notes = notes;
      }
      const v1Payload: Record<string, any> = { ...command.request.v1Payload };
      if (requiresVerification) {
        v1Payload.requires_verification = requiresVerification;
      }
      await retryWithHandledTimeout(
        async () =>
          await this.v1Api.updateInvoice(command.invoiceId, v1Payload, {
            timeout: Duration.fromSeconds(30),
          }),
      );
    }
    if (command.request.documents) {
      await this.handleDocumentUpdate(command, result);
    }
  }

  private async handleDocumentUpdate(
    command: UpdateInvoiceCommand,
    result: CommandInvoiceContext<UpdateInvoiceRequest>,
  ): Promise<void> {
    const documentsPayload = command.request.documents;
    const entityDocuments = result.entity.documents.getItems();
    if (documentsPayload) {
      for (const document of documentsPayload.toAdd) {
        const existingDocument = entityDocuments.find(
          (doc) => doc.externalUrl === document.externalUrl,
        );
        if (!existingDocument) {
          this.logger.error(
            `No invoice document found with the same external URL for document with name ${document.name} for v1 payload`,
          );
        }
        const v1Body = {
          filestack_url: document.externalUrl,
          invoice_id: command.invoiceId,
          name: document.name,
          url: document.internalUrl,
          keepOriginalID: true,
          id: existingDocument?.id,
          metadata: {
            label: InvoiceDocumentLabelMapping[document.label],
            thumbnailUrl: document.thumbnailUrl,
          },
        };
        await retryWithHandledTimeout(
          async () =>
            await this.v1Api.createInvoiceDocument(v1Body, {
              timeout: Duration.fromSeconds(30),
            }),
        );
      }
      for (const documentId of documentsPayload.toDelete) {
        await retryWithHandledTimeout(
          async () =>
            await this.v1Api.deleteInvoiceDocument(documentId, {
              timeout: Duration.fromSeconds(30),
            }),
        );
      }

      for (const document of documentsPayload.toUpdate) {
        const existingDocument = await this.v1Api.getInvoiceDocument(
          document.id,
        );
        existingDocument.metadata = existingDocument.metadata || {};
        existingDocument.metadata.label =
          InvoiceDocumentLabelMapping[document.label];

        await retryWithHandledTimeout(
          async () =>
            await this.v1Api.updateInvoiceDocument(
              document.id,
              existingDocument,
              Duration.fromSeconds(30),
            ),
        );
      }
    }
  }
}
