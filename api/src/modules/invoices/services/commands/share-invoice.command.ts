import { RequestCommand } from '@module-cqrs';
import { ShareInvoiceRequest } from '../../data';

export class ShareInvoiceCommand extends RequestCommand<
  ShareInvoiceRequest,
  void
> {
  constructor(readonly invoiceId: string, request: ShareInvoiceRequest) {
    super(request);
  }
}
