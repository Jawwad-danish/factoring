import { ChangeActionsRuleExecutor } from '@common';
import { CommandInvoiceTaggedContext } from '@module-invoices/data';

export abstract class InvoiceActivityRuleService<
  P,
> extends ChangeActionsRuleExecutor<CommandInvoiceTaggedContext<P>> {}
