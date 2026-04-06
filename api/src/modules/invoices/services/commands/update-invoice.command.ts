import { RequestCommand } from '@module-cqrs';
import { InvoiceContext, UpdateInvoiceRequest } from '../../data';

export class UpdateInvoiceCommand extends RequestCommand<
  UpdateInvoiceRequest,
  InvoiceContext
> {
  constructor(readonly invoiceId: string, request: UpdateInvoiceRequest) {
    super(request);
  }
}
