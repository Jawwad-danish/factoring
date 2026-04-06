import { RequestCommand } from '@module-cqrs';
import { InvoiceContext, RejectInvoiceRequest } from '../../data';

export class RejectInvoiceCommand extends RequestCommand<
  RejectInvoiceRequest,
  InvoiceContext
> {
  constructor(readonly invoiceId: string, request: RejectInvoiceRequest) {
    super(request);
  }
}
