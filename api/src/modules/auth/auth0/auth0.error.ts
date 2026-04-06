import { CauseAwareError, Reason } from '@core/errors';

export class Auth0Error extends CauseAwareError {
  constructor(key: string, value: string, causingError?: Error) {
    super(key, value, causingError);
  }

  getReason(): Reason {
    return Reason.ExternalServiceCall;
  }
}
