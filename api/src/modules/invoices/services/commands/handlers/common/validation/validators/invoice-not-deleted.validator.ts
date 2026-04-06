import { ValidationError } from '@core/validation';
import { CommandInvoiceContext } from '@module-invoices/data';
import { RecordStatus } from '@module-persistence/entities';
import { InvoiceValidator } from '../invoice-validator';

export class InvoiceNotDeletedValidator<P> implements InvoiceValidator<P> {
  async validate(context: CommandInvoiceContext<P>): Promise<void> {
    const { entity } = context;
    if (entity.recordStatus === RecordStatus.Inactive) {
      throw new ValidationError(
        'inactive-invoice',
        'This invoice was deleted and cannot be updated anymore.',
      );
    }
  }
}
