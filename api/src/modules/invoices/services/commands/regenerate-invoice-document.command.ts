import { RequestCommand } from '@module-cqrs';
import { RegenerateInvoiceDocumentRequest } from '@module-invoices/data';

export class RegenerateInvoiceDocumentCommand extends RequestCommand<
  RegenerateInvoiceDocumentRequest,
  void
> {
  constructor(
    readonly invoiceId: string,
    request: RegenerateInvoiceDocumentRequest,
  ) {
    super(request);
  }
}
