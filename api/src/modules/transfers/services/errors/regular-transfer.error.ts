import { CauseAwareError } from '@core/errors';
import { ValidationError } from '@core/validation';

export class RegularTransferError extends CauseAwareError {
  constructor(causingError: Error) {
    super(
      'regular-transfer',
      RegularTransferError.friendlyMessage(causingError),
      causingError,
    );
  }

  private static friendlyMessage(causingError: Error) {
    return causingError instanceof ValidationError
      ? causingError.message
      : `Could not process regular transfer. Please try again or contact your support team.`;
  }
}
