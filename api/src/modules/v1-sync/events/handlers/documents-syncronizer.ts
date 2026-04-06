import { ChangeActions } from '@common';
import { FeatureFlag, FeatureFlagResolver } from '@module-common';
import { Transactional } from '@module-database';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import { TagDefinitionKey } from '@module-persistence/entities';
import { InvoiceRepository } from '@module-persistence/repositories';
import { Injectable, Logger } from '@nestjs/common';
import { V1Api } from '../../api';
import { InvoiceDocumentMapper } from './mapper';
import { delay } from '@core/date-time';

const DOCUMENTS_TO_SYNC = ['Bobtail Invoice.pdf', 'Combined Document.pdf'];
const MAX_RETRIES_TO_FETCH_DOCUMENT_FROM_V1 = 3;

@Injectable()
export class DocumentsSyncronizer {
  private logger = new Logger(DocumentsSyncronizer.name);

  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly v1Api: V1Api,
    private readonly invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor,
    private readonly featureFlagResolver: FeatureFlagResolver,
  ) {}

  @Transactional('sync-documents')
  async sync(invoiceId: string) {
    if (
      this.featureFlagResolver.isEnabled(FeatureFlag.EnableDocumentProcessing)
    ) {
      this.logger.log(
        `Document sync is disabled for invoice ${invoiceId} since document processing is enabled`,
      );
      return;
    }
    let v1Invoice = await this.v1Api.getInvoice(invoiceId);
    const invoice = await this.invoiceRepository.findOneById(invoiceId);
    if (!invoice) {
      this.logger.error(`Could not find invoice with id ${invoiceId}`);
      return;
    }

    for (const documentToSync of DOCUMENTS_TO_SYNC) {
      let v1Document = v1Invoice.invoice_documents.find(
        (data: { name: string }) => data.name === documentToSync,
      );
      if (v1Document) {
        const foundDocument = invoice.documents.find(
          (document) => document.name === v1Document.name,
        );
        if (foundDocument) {
          for (let i = 0; i < MAX_RETRIES_TO_FETCH_DOCUMENT_FROM_V1; i++) {
            const isSameDocument =
              foundDocument.internalUrl === v1Document?.url ||
              foundDocument.externalUrl === v1Document?.url ||
              foundDocument.externalUrl === v1Document?.filestack_url;

            if (!isSameDocument) break;

            this.logger.warn(
              `Document ${documentToSync} is not yet updated in V1. Retrying... (${i + 1})`,
            );

            await delay(3000);

            v1Invoice = await this.v1Api.getInvoice(invoiceId);
            v1Document = v1Invoice.invoice_documents.find(
              (data: { name: string }) => data.name === documentToSync,
            );
          }
          foundDocument.id = v1Document.id;
          foundDocument.internalUrl = v1Document.url;
          foundDocument.externalUrl =
            v1Document.filestack_url || v1Document.url;
        } else {
          invoice.documents.add(
            InvoiceDocumentMapper.v1DocumentToEntity(v1Document),
          );
        }
      } else {
        this.logger.warn(
          `Could not find document ${documentToSync} in V1 invoice`,
        );
      }
    }
    await this.invoiceChangeActionsExecutor.apply(
      invoice,
      ChangeActions.deleteTag(TagDefinitionKey.INVOICE_PDF_IN_PROGRESS, {
        optional: true,
      }),
    );
  }
}
