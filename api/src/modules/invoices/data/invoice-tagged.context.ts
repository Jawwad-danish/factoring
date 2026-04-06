import { InvoiceEntity } from '@module-persistence';
import { ChangeActions } from '@common';

export interface InvoiceTaggedContext {
  invoice: InvoiceEntity;
  changeActions: ChangeActions;
}
export interface CommandInvoiceTaggedContext<TRequest>
  extends InvoiceTaggedContext {
  request: TRequest;
}
