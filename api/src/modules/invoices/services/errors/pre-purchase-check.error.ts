import { CauseAwareError } from '@core/errors';

export class PrePurchaseCheckError extends CauseAwareError {
  constructor(id: string, causingError: Error) {
    super(
      'pre-purchase-check',
      `Could not check invoice with id ${id} for purchase`,
      causingError,
    );
  }
}
