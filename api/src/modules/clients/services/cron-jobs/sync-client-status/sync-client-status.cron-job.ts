import { MonitoredJob } from '@core/cron';
import { CONFIG_SERVICE, ConfigService } from '@module-config';
import { CronJobType } from '@module-cron/data';
import { DatabaseService } from '@module-database';
import { WorkerJobType } from '@module-persistence';
import { JobService } from '@module-worker';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class SyncClientStatusCronJob extends MonitoredJob {
  protected logger: Logger = new Logger(SyncClientStatusCronJob.name);

  constructor(
    @Inject(CONFIG_SERVICE) private readonly configService: ConfigService,
    schedulerRegistry: SchedulerRegistry,
    databaseService: DatabaseService,
    private readonly jobService: JobService,
  ) {
    super(schedulerRegistry, databaseService);

    const isEnabled = this.configService
      .getValue('ENABLE_CLIENT_SERVICE_SYNC_CRON')
      .asBoolean();
    if (!isEnabled) {
      this.logger.warn('Client service status sync CRON Job is disabled');
      return;
    }

    const cronPattern = configService.getValue('CLIENT_SERVICE_SYNC_CRON');
    this.registerJob('CLIENT_SERVICE_SYNC_CRON', cronPattern.asString());
  }

  async execute() {
    this.logger.debug('Enqueueing client status sync job');
    await this.jobService.enqueue({
      type: WorkerJobType.Cron,
      payload: {
        jobType: CronJobType.ClientPeriodicTasks,
      },
    });
  }
}
