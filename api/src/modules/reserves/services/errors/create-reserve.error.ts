import { CauseAwareError } from '@core/errors';

export class CreateReserveError extends CauseAwareError {
  constructor(clientId: string, causingError?: Error) {
    super(
      'create-reserve-error',
      `Could not create reserve for client ${clientId}`,
      causingError,
    );
  }
}
