import { CauseAwareError } from '@core/errors';

export class CreateRewardReserveError extends CauseAwareError {
  constructor(message: string, causingError?: Error) {
    super('create-reward-reserve-error', message, causingError);
  }
}
