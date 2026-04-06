import { DatabaseService } from '@module-database';
import { Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { Observability } from '../observability/observability';

export abstract class MonitoredJob {
  protected logger: Logger = new Logger(MonitoredJob.name);

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly databaseService: DatabaseService,
  ) {}

  registerJob(name: string, pattern: string, timeZone?: string) {
    if (this.schedulerRegistry.doesExist('cron', name)) {
      this.schedulerRegistry.deleteCronJob(name);
      this.logger.debug('Removed CRON Job', {
        name: name,
      });
    }
    const job = new CronJob(
      pattern,
      async () => {
        this.databaseService.withRequestContext(() => {
          return Observability.withMonitor(name, () => this.execute(), {
            schedule: {
              type: 'crontab',
              value: pattern,
            },
          });
        });
      },
      null,
      false,
      timeZone,
    );
    this.schedulerRegistry.addCronJob(name, job);
    job.start();
    this.logger.debug('Created CRON Job', {
      name: name,
      pattern,
      timeZone,
    });
  }

  abstract execute(): Promise<void>;
}
