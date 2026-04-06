import { CauseAwareError } from '@core/errors';
import { ValidationError } from '@core/validation';

export class PurchaseInvoiceError extends CauseAwareError {
  constructor(id: string, causingError: Error) {
    super(
      'purchase-invoice',
      PurchaseInvoiceError.friendlyMessage(id, causingError),
      causingError,
    );
  }

  private static friendlyMessage(id: string, causingError: Error) {
    return causingError instanceof ValidationError
      ? causingError.message
      : `Could not purchase invoice with id ${id}`;
  }
}
