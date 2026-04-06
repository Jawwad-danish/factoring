import { CauseAwareError } from '@core/errors';

export class DeleteFirebaseTokenError extends CauseAwareError {
  constructor(token: string, causingError?: Error) {
    super(
      'delete-firebase-token-error',
      `Could not delete firebase token {${token}}`,
      causingError,
    );
  }
}
