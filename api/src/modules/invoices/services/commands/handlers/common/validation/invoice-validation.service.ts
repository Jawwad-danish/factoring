import { ValidationService } from '@core/validation';
import { CommandInvoiceContext } from '@module-invoices/data';

export abstract class InvoiceValidationService<P> extends ValidationService<
  CommandInvoiceContext<P>
> {
  async validatePostPreparation(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context: CommandInvoiceContext<P>,
  ): Promise<void> {}
}
