import { CauseAwareError } from '@core/errors';
import { ValidationError } from '@core/validation';

export class RejectInvoiceError extends CauseAwareError {
  constructor(id: string, causingError: Error) {
    super(
      'reject-invoice',
      RejectInvoiceError.friendlyMessage(id, causingError),
      causingError,
    );
  }

  private static friendlyMessage(id: string, causingError: Error) {
    return causingError instanceof ValidationError
      ? causingError.message
      : `Could not reject invoice with id ${id}`;
  }
}
