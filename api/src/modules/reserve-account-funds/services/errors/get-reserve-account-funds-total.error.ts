import { CauseAwareError } from '@core/errors';

export class GetReserveAccountFundsTotalError extends CauseAwareError {
  constructor(clientId: string, causingError?: Error) {
    super(
      'get-total-reserve-account-funds-error',
      `Could not obtain total reserve account funds for client ${clientId}`,
      causingError,
    );
  }
}
