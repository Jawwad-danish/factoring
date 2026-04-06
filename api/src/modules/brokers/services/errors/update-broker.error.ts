import { CauseAwareError } from '@core/errors';
import { ValidationError } from 'class-validator';

export class BrokerUpdateError extends CauseAwareError {
  constructor(causingError: Error) {
    super(
      'broker-update-error',
      BrokerUpdateError.friendlyMessage(causingError),
      causingError,
    );
  }

  static friendlyMessage(causingError: Error) {
    return causingError instanceof ValidationError
      ? causingError.message
      : `Could not update broker`;
  }
}
