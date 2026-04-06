import { CauseAwareError } from '@core/errors';
import { ValidationError } from 'class-validator';

export class ClientBankAccountCreateError extends CauseAwareError {
  constructor(causingError: Error) {
    super(
      'client-create-bank-account-error',
      ClientBankAccountCreateError.friendlyMessage(causingError),
      causingError,
    );
  }

  static friendlyMessage(causingError: Error) {
    return causingError instanceof ValidationError
      ? causingError.message
      : `Could not create client bank account`;
  }
}
