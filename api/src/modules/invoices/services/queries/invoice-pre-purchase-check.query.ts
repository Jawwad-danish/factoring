import { Query } from '@module-cqrs';
import { InvoicePrePurchaseCheck, PurchaseInvoiceRequest } from '../../data';

export class InvoicePrePurchaseCheckQuery extends Query<InvoicePrePurchaseCheck> {
  constructor(readonly id: string, readonly request: PurchaseInvoiceRequest) {
    super();
  }
}
