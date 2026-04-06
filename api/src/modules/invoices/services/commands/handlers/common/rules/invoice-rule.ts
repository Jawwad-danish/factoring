import { ChangeActionsRule } from '@common';
import { CommandInvoiceContext } from '@module-invoices/data';

export interface InvoiceRule<P>
  extends ChangeActionsRule<CommandInvoiceContext<P>> {}
