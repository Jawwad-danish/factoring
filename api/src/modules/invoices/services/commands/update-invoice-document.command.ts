import { RequestCommand } from '@module-cqrs';
import {
  InvoiceDocumentEntity,
  InvoiceEntity,
} from '@module-persistence/entities';
import { UpdateInvoiceDocumentRequest } from '../../data';

export class UpdateInvoiceDocumentCommand extends RequestCommand<
  UpdateInvoiceDocumentRequest,
  [InvoiceEntity, InvoiceDocumentEntity]
> {
  constructor(
    readonly invoiceId: string,
    request: UpdateInvoiceDocumentRequest,
  ) {
    super(request);
  }
}
