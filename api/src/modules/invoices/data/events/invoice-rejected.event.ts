import { BaseModel } from '@core/data';
import { RejectInvoiceRequest } from '../web';

export class InvoiceRejectedEvent extends BaseModel<InvoiceRejectedEvent> {
  request: RejectInvoiceRequest;
  invoiceId: string;
}
