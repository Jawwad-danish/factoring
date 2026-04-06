import { CauseAwareError } from '@core/errors';

export class RevertInvoiceError extends CauseAwareError {
  constructor(id: string, causingError: Error) {
    super(
      'revert-invoice',
      `Could not revert invoice with id ${id}`,
      causingError,
    );
  }
}
