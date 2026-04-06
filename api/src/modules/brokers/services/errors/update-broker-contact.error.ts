import { CauseAwareError } from '@core/errors';
import { ValidationError } from 'class-validator';

export class BrokerContactUpdateError extends CauseAwareError {
  constructor(causingError: Error) {
    super(
      'broker-update-error',
      BrokerContactUpdateError.friendlyMessage(causingError),
      causingError,
    );
  }

  static friendlyMessage(causingError: Error) {
    return causingError instanceof ValidationError
      ? causingError.message
      : `Could not update broker contact`;
  }
}
