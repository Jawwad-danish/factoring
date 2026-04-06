import { CauseAwareError, Reason } from '@core/errors';

export class TransfersApiError extends CauseAwareError {
  constructor(readonly id: string, readonly cause: Error) {
    super(id, `Call to Transfers Service API failed for ${id}`, cause);
  }

  getReason(): Reason {
    return Reason.ExternalServiceCall;
  }
}
