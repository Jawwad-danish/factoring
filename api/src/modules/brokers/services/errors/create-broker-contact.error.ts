import { CauseAwareError } from '@core/errors';
import { ValidationError } from 'class-validator';

export class BrokerContactCreateError extends CauseAwareError {
  constructor(causingError: Error) {
    super(
      'broker-contact-create-error',
      BrokerContactCreateError.friendlyMessage(causingError),
      causingError,
    );
  }

  static friendlyMessage(causingError: Error) {
    return causingError instanceof ValidationError
      ? causingError.message
      : `Could not create broker contact`;
  }
}
