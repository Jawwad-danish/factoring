import { MonitoredJob } from '@core/cron';
import { BUSINESS_TIMEZONE } from '@core/date-time';
import { CronJobType } from '@module-cron/data';
import { DatabaseService } from '@module-database';
import { WorkerJobType } from '@module-persistence';
import { JobService } from '@module-worker';
import { Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { TransferTime, TransferTimeService } from '../../../common';

@Injectable()
export class ScheduledRegularCronJob extends MonitoredJob {
  constructor(
    schedulerRegistry: SchedulerRegistry,
    databaseService: DatabaseService,
    private readonly transferTimeService: TransferTimeService,
    private readonly jobService: JobService,
  ) {
    super(schedulerRegistry, databaseService);
    this.registerJobs();
  }

  private registerJobs() {
    const transferTimes = this.transferTimeService.findAllTransferTimes();
    transferTimes.forEach((transferTime) => {
      const cronPattern = this.toCronPattern(transferTime);
      this.registerJob(
        `SCHEDULED_REGULAR_TRANSFER_${transferTime.name.toUpperCase()}`,
        cronPattern,
        BUSINESS_TIMEZONE,
      );
    });
  }

  private toCronPattern(transferTime: TransferTime): string {
    const businessDateTransferTime =
      this.transferTimeService.getTransferTimeInBusinessTimezone(transferTime);
    return `0 ${businessDateTransferTime.send.minute()} ${businessDateTransferTime.send.hour()} * * *`;
  }

  async execute() {
    this.logger.debug('Enqueueing scheduled regular transfer job');
    await this.jobService.enqueue({
      type: WorkerJobType.Cron,
      payload: {
        jobType: CronJobType.ScheduledRegularTransfer,
      },
    });
  }
}
