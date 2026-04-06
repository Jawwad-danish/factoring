import { CauseAwareError } from '@core/errors';
import { ValidationError } from 'class-validator';

export class BrokerCreateError extends CauseAwareError {
  constructor(causingError: Error) {
    super(
      'broker-create-error',
      BrokerCreateError.friendlyMessage(causingError),
      causingError,
    );
  }

  static friendlyMessage(causingError: Error) {
    return causingError instanceof ValidationError
      ? causingError.message
      : `Could not create broker`;
  }
}
