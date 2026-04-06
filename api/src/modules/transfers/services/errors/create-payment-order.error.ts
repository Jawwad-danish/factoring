import { CauseAwareError } from '@core/errors';
import { ValidationError } from '@core/validation';

export class CreatePaymentOrderError extends CauseAwareError {
  constructor(clientId: string, bankAccountId: string, causingError: Error) {
    super(
      'create-payment-order',
      CreatePaymentOrderError.friendlyMessage(
        clientId,
        bankAccountId,
        causingError,
      ),
      causingError,
    );
  }

  private static friendlyMessage(
    clientId: string,
    bankAccountId: string,
    causingError: Error,
  ) {
    return causingError instanceof ValidationError
      ? causingError.message
      : `Could not create payment order for clientId: ${clientId} bankAccountId: ${bankAccountId}`;
  }
}
