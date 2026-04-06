import { CauseAwareError } from '@core/errors';

export class DeleteInvoiceError extends CauseAwareError {
  constructor(id: string, causingError: Error) {
    super(
      'delete-invoice',
      `Could not delete invoice with id ${id}`,
      causingError,
    );
  }
}
