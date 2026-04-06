import { BaseModel } from '@core/data';

export class RegenerateInvoiceEvent extends BaseModel<RegenerateInvoiceEvent> {
  invoiceId: string;
}
