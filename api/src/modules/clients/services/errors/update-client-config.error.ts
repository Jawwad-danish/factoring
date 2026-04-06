import { CauseAwareError, Reason } from '@core/errors';

export class UpdateClientConfigError extends CauseAwareError {
  constructor(id: string, causingError: Error) {
    super(
      'update-client-config',
      UpdateClientConfigError.friendlyMessage(id, causingError),
      causingError,
    );
  }

  private static friendlyMessage(id: string, causingError: Error) {
    if (
      causingError instanceof CauseAwareError &&
      causingError.getReason() === Reason.ExternalServiceCall &&
      causingError.cause?.message === 'Rate should be greater than 0'
    ) {
      return causingError.cause?.message;
    }
    return `Could not update config for client with id ${id}`;
  }
}
