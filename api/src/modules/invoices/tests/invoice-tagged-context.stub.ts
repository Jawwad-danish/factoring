import { ChangeActions } from '@common';
import { CommandInvoiceTaggedContext } from '@module-invoices/data';
import { EntityStubs } from '@module-persistence/test';

export const buildStubInvoiceTaggedContext = <P>(
  data: Partial<CommandInvoiceTaggedContext<P>> &
    Pick<CommandInvoiceTaggedContext<P>, 'request'>,
): CommandInvoiceTaggedContext<P> => {
  const context: CommandInvoiceTaggedContext<P> = {
    invoice: EntityStubs.buildStubInvoice(),
    request: data.request,
    changeActions: ChangeActions.empty(),
  };
  Object.assign(context, data);
  return context;
};
