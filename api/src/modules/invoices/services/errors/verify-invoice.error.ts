import { CauseAwareError } from '@core/errors';

export class VerifyInvoiceError extends CauseAwareError {
  constructor(id: string, causingError: Error) {
    super(
      'verify-invoice',
      `Could not verify invoice with id ${id}`,
      causingError,
    );
  }
}
