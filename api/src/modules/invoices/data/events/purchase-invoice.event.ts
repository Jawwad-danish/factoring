import { BaseModel } from '@core/data';
import { Client } from '@module-clients/data';

export class PurchaseInvoiceEvent extends BaseModel<PurchaseInvoiceEvent> {
  client: Client;
  brokerId: null | string;
  purchasedAt: null | Date;
}
