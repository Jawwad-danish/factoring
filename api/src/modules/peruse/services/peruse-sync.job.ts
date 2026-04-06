import { MonitoredJob } from '@core/cron';
import { FeatureFlag, FeatureFlagResolver } from '@module-common';
import { CONFIG_SERVICE, ConfigService } from '@module-config';
import { DatabaseService } from '@module-database';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { PeruseService } from './peruse.service';

const CRON_JOB_NAME = 'PERUSE_SYNC_CRON';

@Injectable()
export class PeruseSyncJob extends MonitoredJob {
  protected logger: Logger = new Logger(PeruseSyncJob.name);

  constructor(
    @Inject(CONFIG_SERVICE) configService: ConfigService,
    featureFlagResolver: FeatureFlagResolver,
    schedulerRegistry: SchedulerRegistry,
    databaseService: DatabaseService,
    readonly peruseService: PeruseService,
  ) {
    super(schedulerRegistry, databaseService);

    if (featureFlagResolver.isEnabled(FeatureFlag.Peruse)) {
      const cronJob = configService.getValue(CRON_JOB_NAME);
      const cronPattern = cronJob.asString();
      this.registerJob(CRON_JOB_NAME, cronPattern);
    }
  }

  async execute() {
    try {
      await this.peruseService.sync();
    } catch (error) {
      this.logger.error(`Peruse sync job failed`, error);
    }
  }
}
