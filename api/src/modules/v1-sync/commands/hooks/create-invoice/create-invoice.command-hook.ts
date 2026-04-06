import { Duration, delay } from '@core/date-time';
import { CauseAwareError } from '@core/errors';
import { FeatureFlag, FeatureFlagResolver } from '@module-common';
import { CommandHook } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import { InvoiceContext } from '@module-invoices';
import { CreateInvoiceCommand } from '@module-invoices/commands';
import { TagDefinitionKey, VerificationStatus } from '@module-persistence';
import { HttpException, HttpStatus } from '@nestjs/common';
import { V1Api } from '../../../api';
import { V1SyncCommandHook } from '../v1-sync.command-hook';

@CommandHook(CreateInvoiceCommand)
export class CreateInvoiceCommandHook extends V1SyncCommandHook<CreateInvoiceCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doAfterCommand(
    command: CreateInvoiceCommand,
    result: InvoiceContext,
  ): Promise<void> {
    if (command.request.v1Payload) {
      const v1Documents = command.request.v1Payload['invoice_documents']
        ? this.overrideDocumentsId(
            command.request.v1Payload['invoice_documents'],
            result,
          )
        : [];
      const requiresVerification = [
        VerificationStatus.InProgress,
        VerificationStatus.Required,
      ].includes(result.entity.verificationStatus);

      const createInvoicePayload: Record<string, any> = {
        ...command.request.v1Payload,
        id: result.entity.id,
        keepOriginalID: true,
        invoice_documents: v1Documents,
      };

      if (
        requiresVerification &&
        this.featureFlagResolver.isEnabled(FeatureFlag.VerificationEngine)
      ) {
        createInvoicePayload.requires_verification = requiresVerification;
        const activity = result.entity.activities.find(
          (activity) =>
            activity.tagDefinition.key === TagDefinitionKey.VERIFICATION_ENGINE,
        );

        if (activity) {
          createInvoicePayload.createVerificationNotePayload = {
            notes: activity.note,
            id: activity.id,
            keepOriginalID: true,
          };
        }
      }

      try {
        const v1Invoice = await this.callWithRetry(createInvoicePayload);
        if (v1Invoice) {
          this.logger.warn(
            `No display ID set to invoice with id ${createInvoicePayload.id}`,
            {
              invoiceId: createInvoicePayload.id,
            },
          );
          result.entity.displayId = String(v1Invoice.display_id);
        }
      } catch (error) {
        this.handleCreateInvoiceError(error);
      }
    }
  }

  private handleCreateInvoiceError(error: any): void {
    this.logger.error('Error while creating invoice', error);
    throw new CauseAwareError('Error while creating invoice', error);
  }

  private async callWithRetry(
    payload: Record<string, any>,
  ): Promise<null | Record<string, any>> {
    try {
      const v1Invoice = await this.v1Api.createInvoice(payload, {
        timeout: Duration.fromSeconds(30),
      });

      return v1Invoice;
    } catch (error) {
      if (error.cause && error.cause instanceof HttpException) {
        const httpError = error.cause;
        const status = httpError.getStatus();

        if (status === HttpStatus.GATEWAY_TIMEOUT) {
          const invoiceId = payload.id;
          for (let i = 0; i < 2; i++) {
            const foundInvoice = await this.findInvoice(invoiceId);
            if (foundInvoice) {
              return foundInvoice;
            }
            await delay(5000);
          }
          return null;
        }
      }
      throw error;
    }
  }

  private async findInvoice(invoiceId: string): Promise<any | null> {
    try {
      return await this.v1Api.getInvoice(invoiceId);
    } catch (error) {
      this.logger.error(
        `Could not find invoice with id ${invoiceId} in V1 for creation`,
        {
          invoiceId,
          errorMessage: error.message,
        },
      );
      return null;
    }
  }

  private overrideDocumentsId(
    v1Documents: any[],
    result: InvoiceContext,
  ): any[] {
    const v2Documents = result.entity.documents.getItems();
    return v1Documents.map((v1Document) => {
      const existingDocument = v2Documents.find(
        (doc) => doc.externalUrl === v1Document.filestack_url,
      );
      return {
        ...v1Document,
        keepOriginalID: true,
        id: existingDocument?.id,
      };
    });
  }
}
