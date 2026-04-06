import { Validator } from '@core/validation';
import { CommandInvoiceContext } from '@module-invoices/data';

export interface InvoiceValidator<P>
  extends Validator<CommandInvoiceContext<P>> {}
