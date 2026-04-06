import { InvoiceEvents } from '@common';
import { Observability } from '@core/observability';
import { delay } from '@core/date-time';
import { DatabaseService } from '@module-database';
import { CreateInvoiceEvent } from '@module-invoices';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DocumentsSyncronizer } from './documents-syncronizer';

@Injectable()
export class SyncDocumentOnInvoiceCreateEventHandler {
  constructor(
    private readonly documentsSyncronizer: DocumentsSyncronizer,
    private readonly databaseService: DatabaseService,
  ) {}

  @OnEvent(InvoiceEvents.CreateInvoice, { async: true })
  @Observability.WithScope('sync-document-create-invoice-event')
  async handle({ invoice }: CreateInvoiceEvent) {
    await delay(5000);
    await this.databaseService.withRequestContext(async () => {
      await this.documentsSyncronizer.sync(invoice.id);
    });
  }
}
