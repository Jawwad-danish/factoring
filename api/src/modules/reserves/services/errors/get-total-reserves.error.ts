import { CauseAwareError } from '@core/errors';

export class GetTotalReservesError extends CauseAwareError {
  constructor(clientId: string, causingError?: Error) {
    super(
      'get-total-reserves-error',
      `Could not obtain total reserves to client ${clientId}`,
      causingError,
    );
  }
}
