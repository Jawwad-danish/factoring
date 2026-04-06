import { CauseAwareError, Reason } from '@core/errors';
import { ReservePayloadType } from '../../data';

export class UnknownReserveTypeError extends CauseAwareError {
  constructor(type: ReservePayloadType) {
    super('unknown-reserve-type', `Unknown reserve type ${type}`);
  }

  getReason(): Reason {
    return Reason.Validation;
  }
}
