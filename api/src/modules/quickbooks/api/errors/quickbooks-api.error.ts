import { CauseAwareError, Reason } from '@core/errors';

export class QuickbooksApiError extends CauseAwareError {
  constructor(message: string, causingError?: Error) {
    super(
      'quickbooks-api-error',
      `Quickbooks API error: ${message}`,
      causingError,
    );
  }

  getReason(): Reason {
    return Reason.ExternalServiceCall;
  }
}
