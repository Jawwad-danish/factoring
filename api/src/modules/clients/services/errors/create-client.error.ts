import { CauseAwareError } from '@core/errors';
import { ValidationError } from 'class-validator';

export class ClientCreateError extends CauseAwareError {
  constructor(causingError: Error) {
    super(
      'client-create-error',
      ClientCreateError.friendlyMessage(causingError),
      causingError,
    );
  }

  static friendlyMessage(causingError: Error) {
    return causingError instanceof ValidationError
      ? causingError.message
      : `Could not create client`;
  }
}
