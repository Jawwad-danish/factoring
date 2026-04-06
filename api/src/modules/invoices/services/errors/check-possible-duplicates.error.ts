import { CauseAwareError } from '@core/errors';

export class CheckPossibleDuplicatesError extends CauseAwareError {
  constructor(causingError: Error) {
    super(
      'check-possible-duplicates',
      `Could not check for possible duplicates`,
      causingError,
    );
  }
}
