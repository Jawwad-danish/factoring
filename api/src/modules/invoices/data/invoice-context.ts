import { InvoiceEntity } from '@module-persistence/entities';
import { Client } from '@module-clients';
import { Broker } from '@module-brokers';

export interface InvoiceContext {
  client: Client;
  broker: Broker | null;
  entity: InvoiceEntity;
}
export interface CommandInvoiceContext<P> extends InvoiceContext {
  payload: P;
}
