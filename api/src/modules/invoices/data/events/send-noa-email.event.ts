import { BaseModel } from '@core/data';
import { InvoiceEntity } from '@module-persistence';
import { Client } from '@module-clients/data';
import { Broker } from '@module-brokers/data';

export class SendNoaEvent extends BaseModel<SendNoaEvent> {
  client: Client;
  broker: Broker;
  invoice: InvoiceEntity;
}
