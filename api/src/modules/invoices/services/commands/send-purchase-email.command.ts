import { Command } from '@module-cqrs';
import { InvoiceEntity } from '@module-persistence/entities';

export class SendPurchaseEmailCommand extends Command<InvoiceEntity> {
  constructor(readonly invoice: InvoiceEntity) {
    super();
  }
}
