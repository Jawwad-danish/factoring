import { CreateInvoiceRequest } from '@fs-bobtail/factoring/data';
import { RequestCommand } from '@module-cqrs';
import { InvoiceContext } from '../../data';

export class CreateInvoiceCommand extends RequestCommand<
  CreateInvoiceRequest,
  InvoiceContext
> {
  constructor(request: CreateInvoiceRequest) {
    super(request);
  }
}
