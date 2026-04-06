import { CauseAwareError, Reason } from '@core/errors';

export class V1ApiError extends CauseAwareError {
  constructor(readonly id: string, readonly cause: Error) {
    super(id, `Call to V1 API failed for ${id}`, cause);
  }

  getReason(): Reason {
    return Reason.ExternalServiceCall;
  }
}
