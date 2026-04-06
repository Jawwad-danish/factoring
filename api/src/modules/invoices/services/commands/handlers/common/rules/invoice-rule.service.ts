import { ChangeActionsRuleExecutor } from '@common';
import { CommandInvoiceContext } from '@module-invoices/data';

export abstract class InvoiceRuleService<P> extends ChangeActionsRuleExecutor<
  CommandInvoiceContext<P>
> {}
