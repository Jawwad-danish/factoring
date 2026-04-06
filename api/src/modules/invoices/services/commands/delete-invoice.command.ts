import { RequestCommand } from '@module-cqrs';
import { DeleteInvoiceRequest } from '@module-invoices/data';

export class DeleteInvoiceCommand extends RequestCommand<
  DeleteInvoiceRequest,
  void
> {
  constructor(readonly invoiceId: string, request: DeleteInvoiceRequest) {
    super(request);
  }
}
