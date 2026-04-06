import { CauseAwareError, Reason } from '@core/errors';

export class ClientBrokerAssignmentNotFoundError extends CauseAwareError {
  constructor(id: string, causingError: Error) {
    super(
      'client-broker-assignment-not-found',
      `Could not find client broker assignment with id ${id}`,
      causingError,
    );
  }

  getReason(): Reason {
    return Reason.Missing;
  }
}
