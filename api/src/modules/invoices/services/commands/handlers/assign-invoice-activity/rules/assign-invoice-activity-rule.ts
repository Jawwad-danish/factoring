import { ChangeActionsRule } from '@common';
import { CommandInvoiceTaggedContext } from '@module-invoices/data';

export interface AssignInvoiceActivityRule<P>
  extends ChangeActionsRule<CommandInvoiceTaggedContext<P>> {}
