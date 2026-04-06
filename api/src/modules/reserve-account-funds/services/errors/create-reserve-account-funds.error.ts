import { CauseAwareError } from '@core/errors';

export class CreateReserveAccountFundsError extends CauseAwareError {
  constructor(clientId: string, causingError?: Error) {
    super(
      'create-reserve-account-funds-error',
      `Could not create reserve account funds for client ${clientId}`,
      causingError,
    );
  }
}
