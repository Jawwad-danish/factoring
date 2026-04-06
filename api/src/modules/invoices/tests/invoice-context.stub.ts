import { buildStubClient } from '@module-clients/test';
import { CommandInvoiceContext, InvoiceContext } from '../data/invoice-context';
import { buildStubBroker } from '@module-brokers/test';
import { EntityStubs } from '@module-persistence/test';

export const buildStubInvoiceContext = (
  data: Partial<InvoiceContext>,
): InvoiceContext => {
  const context: InvoiceContext = {
    client: buildStubClient(),
    broker: buildStubBroker(),
    entity: EntityStubs.buildStubInvoice(),
  };
  Object.assign(context, data);
  return context;
};

export const buildStubCommandInvoiceContext = <P>(
  data: Partial<CommandInvoiceContext<P>> &
    Pick<CommandInvoiceContext<P>, 'payload'>,
): CommandInvoiceContext<P> => {
  const context: CommandInvoiceContext<P> = {
    client: buildStubClient(),
    broker: buildStubBroker(),
    entity: EntityStubs.buildStubInvoice(),
    payload: data.payload,
  };
  Object.assign(context, data);
  return context;
};
