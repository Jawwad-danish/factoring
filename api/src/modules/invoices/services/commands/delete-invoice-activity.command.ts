import { RequestCommand } from '@module-cqrs';
import { DeleteInvoiceActivityRequest as DeleteInvoiceActivityRequest } from '@module-invoices/data';

export class DeleteInvoiceActivityCommand extends RequestCommand<
  DeleteInvoiceActivityRequest,
  void
> {
  constructor(
    readonly invoiceId: string,
    readonly activityId: string,
    request: DeleteInvoiceActivityRequest,
  ) {
    super(request);
  }
}
