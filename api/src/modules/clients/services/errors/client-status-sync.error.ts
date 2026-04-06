import { CauseAwareError } from '@core/errors';

export class ClientStatusSyncError extends CauseAwareError {
  constructor(causingError: Error) {
    super('client-status-sync', `Could not sync client status`, causingError);
  }
}
