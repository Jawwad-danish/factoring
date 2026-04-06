import { CauseAwareError, Reason } from '@core/errors';

export class ClientNotFoundError extends CauseAwareError {
  constructor(id: string, causingError: Error) {
    super(
      'client-not-found',
      `Could not find client with id ${id}`,
      causingError,
    );
  }

  getReason(): Reason {
    return Reason.Missing;
  }
}

export class ClientsNotFoundError extends CauseAwareError {
  constructor(causingError: Error) {
    super('clients-not-found', `Could not find all clients`, causingError);
  }

  getReason(): Reason {
    return Reason.Missing;
  }
}
