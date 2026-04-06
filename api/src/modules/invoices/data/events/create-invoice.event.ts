import { BaseModel } from '@core/data';
import { Client } from '@module-clients';
import { InvoiceEntity } from '@module-persistence';

export class CreateInvoiceEvent extends BaseModel<CreateInvoiceEvent> {
  client: Client;
  invoice: InvoiceEntity;
}
