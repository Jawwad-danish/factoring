import { RequestCommand } from '@module-cqrs';
import { InvoiceContext, VerifyInvoiceRequest } from '../../data';

export class VerifyInvoiceCommand extends RequestCommand<
  VerifyInvoiceRequest,
  InvoiceContext
> {
  constructor(readonly invoiceId: string, request: VerifyInvoiceRequest) {
    super(request);
  }
}
