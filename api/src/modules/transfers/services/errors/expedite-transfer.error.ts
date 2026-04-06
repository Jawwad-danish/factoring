import { CauseAwareError } from '@core/errors';
import { ValidationError } from '@core/validation';

export class ExpediteTransferError extends CauseAwareError {
  constructor(clientId: string, causingError: Error) {
    super(
      'expedite-transfer',
      ExpediteTransferError.friendlyMessage(clientId, causingError),
      causingError,
    );
  }

  private static friendlyMessage(clientId: string, causingError: Error) {
    return causingError instanceof ValidationError
      ? causingError.message
      : `Could not expedite for client with id ${clientId}`;
  }
}
