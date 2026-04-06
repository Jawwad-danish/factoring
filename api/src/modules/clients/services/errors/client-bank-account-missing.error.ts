import { CauseAwareError, Reason } from '@core/errors';

export class ClientBankAccountMissingError extends CauseAwareError {
  constructor(clientId: string, bankAccountId: string, causingError: Error) {
    super(
      'client-bank-account-missing',
      `Could not find client bank account with id ${bankAccountId} for client with id ${clientId}`,
      causingError,
    );
  }

  getReason(): Reason {
    return Reason.Missing;
  }
}
