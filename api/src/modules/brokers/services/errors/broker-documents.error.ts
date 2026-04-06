import { CauseAwareError } from '@core/errors';
import { ValidationError } from 'class-validator';

export class BrokerDocumentsError extends CauseAwareError {
  constructor(message: string, causingError: Error) {
    super(
      message,
      BrokerDocumentsError.friendlyMessage(message, causingError),
      causingError,
    );
  }

  static friendlyMessage(message: string, causingError: Error) {
    return causingError instanceof ValidationError
      ? causingError.message
      : message;
  }
}
