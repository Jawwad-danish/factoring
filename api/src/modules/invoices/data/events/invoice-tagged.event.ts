import { BaseModel } from '@core/data';
import { AssignInvoiceActivityRequest } from '../web';

export class InvoiceTaggedEvent extends BaseModel<InvoiceTaggedEvent> {
  request: AssignInvoiceActivityRequest;
  invoiceId: string;
}
