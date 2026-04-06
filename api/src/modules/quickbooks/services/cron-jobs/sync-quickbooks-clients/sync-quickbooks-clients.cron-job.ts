import { MonitoredJob } from '@core/cron';
import { CONFIG_SERVICE, ConfigService } from '@module-config';
import { FeatureFlag, FeatureFlagResolver } from '@module-common';
import { CronJobType } from '@module-cron/data';
import { DatabaseService } from '@module-database';
import { WorkerJobType } from '@module-persistence';
import { JobService } from '@module-worker';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class SyncQuickbooksClientsCronJob extends MonitoredJob {
  protected logger: Logger = new Logger(SyncQuickbooksClientsCronJob.name);

  constructor(
    @Inject(CONFIG_SERVICE) private readonly configService: ConfigService,
    schedulerRegistry: SchedulerRegistry,
    databaseService: DatabaseService,
    private readonly jobService: JobService,
    private readonly featureFlagResolver: FeatureFlagResolver,
  ) {
    super(schedulerRegistry, databaseService);

    const cronPattern = this.configService.getValue(
      'SYNC_QUICKBOOKS_CLIENTS_CRON',
    );
    this.registerJob('SYNC_QUICKBOOKS_CLIENTS_CRON', cronPattern.asString());
  }

  async execute() {
    if (!this.featureFlagResolver.isEnabled(FeatureFlag.QuickbooksSync)) {
      this.logger.debug('QuickBooks sync is disabled via feature flag');
      return;
    }

    this.logger.debug('Enqueueing sync quickbooks clients job');
    await this.jobService.enqueue({
      type: WorkerJobType.Cron,
      payload: {
        jobType: CronJobType.SyncQuickbooksClients,
      },
    });
  }
}
