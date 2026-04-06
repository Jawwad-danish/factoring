import { CauseAwareError, Reason } from '@core/errors';

export class ClientApiError extends CauseAwareError {
  constructor(readonly id: string, readonly cause: Error) {
    super(id, `Call to client service API failed for ${id}`, cause);
  }

  getReason(): Reason {
    return Reason.ExternalServiceCall;
  }
}
