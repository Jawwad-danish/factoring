import { Observability } from '@core/observability';
import { delay } from '@core/date-time';
import { DatabaseService } from '@module-database';
import { RegenerateInvoiceEvent } from '@module-invoices';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DocumentsSyncronizer } from './documents-syncronizer';

@Injectable()
export class SyncDocumentOnRegenerateInvoiceDocumentHandler {
  constructor(
    private readonly documentsSyncronizer: DocumentsSyncronizer,
    private readonly databaseService: DatabaseService,
  ) {}

  @OnEvent('invoice.regenerate', { async: true })
  @Observability.WithScope('regenerate-invoice-document-event')
  async handle({ invoiceId }: RegenerateInvoiceEvent) {
    await delay(5000);
    await this.databaseService.withRequestContext(async () => {
      await this.documentsSyncronizer.sync(invoiceId);
    });
  }
}
