import { CauseAwareError } from '@core/errors';

export class DeleteAllFirebaseTokenError extends CauseAwareError {
  constructor(userId: string, causingError?: Error) {
    super(
      'delete-all-firebase-token-error',
      `Could not delete all firebase tokens for user ${userId}`,
      causingError,
    );
  }
}
