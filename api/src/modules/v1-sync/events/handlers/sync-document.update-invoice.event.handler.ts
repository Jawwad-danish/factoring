import { Observability } from '@core/observability';
import { delay } from '@core/date-time';
import { DatabaseService } from '@module-database';
import { UpdateInvoiceEvent } from '@module-invoices';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DocumentsSyncronizer } from './documents-syncronizer';

@Injectable()
export class SyncDocumentOnInvoiceCreateUpdateHandler {
  constructor(
    private readonly documentsSyncronizer: DocumentsSyncronizer,
    private readonly databaseService: DatabaseService,
  ) {}

  @OnEvent('invoice.update', { async: true })
  @Observability.WithScope('update-document-create-invoice-event')
  async handle({ invoiceId }: UpdateInvoiceEvent) {
    await delay(5000);
    await this.databaseService.withRequestContext(async () => {
      await this.documentsSyncronizer.sync(invoiceId);
    });
  }
}
