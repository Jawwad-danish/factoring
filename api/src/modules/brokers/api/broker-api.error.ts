import { CauseAwareError, Reason } from '@core/errors';

export class BrokerApiError extends CauseAwareError {
  constructor(readonly id: string, readonly cause: Error) {
    super(id, `Call to broker service API failed for ${id}`, cause);
  }

  getReason(): Reason {
    return Reason.ExternalServiceCall;
  }
}
