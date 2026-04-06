import { InvoiceEvents } from '@common/events';
import { getUTCDate } from '@core/date-time';
import { Observability } from '@core/observability';
import { FeatureFlag, FeatureFlagResolver } from '@module-common';
import { DatabaseService, Transactional } from '@module-database';
import { CreateInvoiceEvent } from '@module-invoices';
import {
  InvoiceDocumentType,
  PeruseJobEntity,
  PeruseJobType,
  PeruseStatus,
} from '@module-persistence/entities';
import {
  InvoiceRepository,
  PeruseRepository,
} from '@module-persistence/repositories';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PeruseClient } from '../peruse-client';

@Injectable()
export class PeruseClassifyDocumentsOnInvoiceCreateEventHandler {
  private logger = new Logger(
    PeruseClassifyDocumentsOnInvoiceCreateEventHandler.name,
  );

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly invoiceRepository: InvoiceRepository,
    private readonly peruseRepository: PeruseRepository,
    private readonly peruseClient: PeruseClient,
    private readonly featureFlag: FeatureFlagResolver,
  ) {}

  @OnEvent(InvoiceEvents.CreateInvoice, { async: true })
  @Observability.WithScope('sync-document-create-invoice-event')
  async onEvent({ invoice }: CreateInvoiceEvent) {
    if (this.featureFlag.isDisabled(FeatureFlag.Peruse)) {
      return;
    }

    await this.databaseService.withRequestContext(async () => {
      try {
        await this.doHandle(invoice.id);
      } catch (error) {
        this.logger.error(
          `Could not create load in Peruse for invoice ${invoice.id}`,
          error,
        );
      }
    });
  }

  @Transactional('peruse-create-load')
  async doHandle(invoiceId: string): Promise<void> {
    const count = await this.invoiceRepository.count({
      createdAt: {
        $gt: getUTCDate().startOf('day').toDate(),
      },
    });
    if (count % 4 !== 0) {
      return;
    }
    const invoice = await this.invoiceRepository.getOneById(invoiceId);
    const uploadedDocuments = invoice.documents.filter(
      (document) => document.type === InvoiceDocumentType.Uploaded,
    );
    const result = await this.peruseClient.bulkClassifyDocuments({
      documents: uploadedDocuments.map((document) => {
        return {
          externalId: document.id,
          url: document.externalUrl,
        };
      }),
    });
    const entity = new PeruseJobEntity();
    entity.invoiceId = invoiceId;
    entity.jobId = result.jobId;
    entity.type = PeruseJobType.BulkClassification;
    entity.request = result.input as any;
    entity.response = null;
    entity.status = PeruseStatus.InProgress;
    this.peruseRepository.persist(entity);
  }
}
