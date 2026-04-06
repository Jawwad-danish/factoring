import { RequestCommand } from '@module-cqrs';
import { InvoiceContext, RevertInvoiceRequest } from '../../data';

export class RevertInvoiceCommand extends RequestCommand<
  RevertInvoiceRequest,
  InvoiceContext
> {
  constructor(readonly invoiceId: string, request: RevertInvoiceRequest) {
    super(request);
  }
}
