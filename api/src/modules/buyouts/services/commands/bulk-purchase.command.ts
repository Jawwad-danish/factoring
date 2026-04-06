import { RequestCommand } from '@module-cqrs';
import { InvoiceContext } from '@module-invoices/data';

export class BulkPurchaseCommand extends RequestCommand<any, InvoiceContext[]> {
  constructor() {
    super({ ingestThrough: true });
  }
}
