import { CauseAwareError } from '@core/errors';
import { CronJobType } from '../data/cron-job-types.enum';

export class CronError extends CauseAwareError {
  constructor(cause: Error, jobType: CronJobType, payload?: any) {
    super(
      'cron-error',
      `Failed to run cron job ${jobType} with payload ${JSON.stringify(
        payload,
      )}`,
      cause,
    );
  }
}
