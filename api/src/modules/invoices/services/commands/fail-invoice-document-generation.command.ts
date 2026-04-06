import { Command } from '@module-cqrs';
import { InvoiceEntity } from '@module-persistence/entities';

export class FailInvoiceDocumentGenerationCommand extends Command<InvoiceEntity> {
  constructor(readonly invoiceId: string) {
    super();
  }
}
