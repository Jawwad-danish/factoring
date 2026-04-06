import { CauseAwareError } from '@core/errors';

export class CreateFirebaseTokenError extends CauseAwareError {
  constructor(userId: string, causingError?: Error) {
    super(
      'create-firebase-token-error',
      `Could not create firebase token for user ${userId}`,
      causingError,
    );
  }
}
