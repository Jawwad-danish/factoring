import { BaseModel } from '@core/data';

export class UpdateInvoiceEvent extends BaseModel<UpdateInvoiceEvent> {
  invoiceId: string;
}
