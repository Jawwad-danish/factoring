import { CauseAwareError } from '@core/errors';

export class ClientStatusesSyncError extends CauseAwareError {
  constructor(causingError: Error) {
    super(
      'client-statuses-sync',
      `Could not sync client statuses`,
      causingError,
    );
  }
}
