import { RequestCommand } from '@module-cqrs';
import { InvoiceContext, PurchaseInvoiceRequest } from '../../data';

export class PurchaseInvoiceCommand extends RequestCommand<
  PurchaseInvoiceRequest,
  InvoiceContext
> {
  constructor(readonly invoiceId: string, request: PurchaseInvoiceRequest) {
    super(request);
  }
}
