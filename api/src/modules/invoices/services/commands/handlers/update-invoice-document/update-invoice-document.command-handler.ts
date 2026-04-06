import { ChangeActions } from '@common';
import { Note } from '@core/data';
import { hashFile } from '@core/services';
import { BasicCommandHandler } from '@module-cqrs';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import {
  InvoiceDocumentEntity,
  InvoiceDocumentType,
  InvoiceEntity,
  RecordStatus,
  TagDefinitionKey,
} from '@module-persistence/entities';
import { InvoiceRepository } from '@module-persistence/repositories';
import { InvoiceEntityUtil } from '@module-persistence/util';
import { CommandHandler } from '@nestjs/cqrs';
import {
  InvoiceDocumentMapper,
  UpdateInvoiceDocumentRequest,
} from '../../../../data';
import { UpdateInvoiceDocumentCommand } from '../../update-invoice-document.command';

@CommandHandler(UpdateInvoiceDocumentCommand)
export class UpdateInvoiceDocumentCommandHandler
  implements BasicCommandHandler<UpdateInvoiceDocumentCommand>
{
  constructor(
    private invoiceRepository: InvoiceRepository,
    private mapper: InvoiceDocumentMapper,
    private invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor,
  ) {}

  async execute({
    invoiceId,
    request,
  }: UpdateInvoiceDocumentCommand): Promise<
    [InvoiceEntity, InvoiceDocumentEntity]
  > {
    let document: null | InvoiceDocumentEntity = null;
    const invoice = await this.invoiceRepository.getOneById(invoiceId);
    if (request.type === InvoiceDocumentType.Generated) {
      this.cleanGeneratedDocuments(invoice);
    }
    if (!request.id) {
      document = await this.updateUploadedDocument(invoice, request);
    } else {
      document = await InvoiceEntityUtil.findActiveDocumentById(
        invoice,
        request.id,
      );
      if (document == null) {
        document = await this.updateUploadedDocument(invoice, request);
      } else {
        document.internalUrl = request.internalUrl;
        document.externalUrl = request.externalUrl;
        document.name = request.name;
      }
    }
    await this.invoiceChangeActionsExecutor.apply(
      invoice,
      ChangeActions.deleteTag(TagDefinitionKey.INVOICE_PDF_IN_PROGRESS, {
        optional: true,
      }).concat(
        ChangeActions.addActivity(
          TagDefinitionKey.UPDATE_INVOICE,
          Note.from({
            text:
              request.type === InvoiceDocumentType.Generated
                ? 'Generated document changed'
                : 'Uploaded new document',
            payload: {
              data: {
                internalUrl: document.internalUrl,
                externalUrl: document.externalUrl,
              },
            },
          }),
        ),
      ),
    );
    return [invoice, document];
  }

  private async updateUploadedDocument(
    invoice: InvoiceEntity,
    request: UpdateInvoiceDocumentRequest,
  ): Promise<InvoiceDocumentEntity> {
    const document = await this.mapper.updateRequestToEntity(request);
    document.fileHash = await hashFile(document.internalUrl);
    invoice.documents.add(document);
    return document;
  }

  private cleanGeneratedDocuments(invoice: InvoiceEntity) {
    invoice.documents
      .filter(
        (document) =>
          document.type === InvoiceDocumentType.Generated &&
          document.recordStatus === RecordStatus.Active,
      )
      .forEach((document) => (document.recordStatus = RecordStatus.Inactive));
  }
}
