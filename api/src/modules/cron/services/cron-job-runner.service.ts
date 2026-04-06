import { CrossCuttingConcerns } from '@core/util';
import { ClientService } from '@module-clients';
import { QuickbooksService } from '@module-quickbooks';
import { TransferService } from '@module-transfers';
import { Injectable } from '@nestjs/common';
import { CronJobType } from '../data/cron-job-types.enum';
import { CronError } from '../errors';

@Injectable()
export class CronJobRunner {
  constructor(
    private readonly clientService: ClientService,
    private readonly quickbooksService: QuickbooksService,
    private readonly transferService: TransferService,
  ) {}

  @CrossCuttingConcerns({
    error: {
      errorSupplier: (cause: Error, data: any) =>
        new CronError(cause, data?.jobType, data?.payload),
    },
    logging: (data: any) => {
      return {
        message: `Running cron job ${data?.jobType}`,
        payload: data,
      };
    },
  })
  async runJob(data: any): Promise<void> {
    if (!data || !data.jobType) {
      throw new Error('Invalid cron job data: missing jobType');
    }

    const jobType = data.jobType;
    switch (jobType) {
      case CronJobType.ClientPeriodicTasks:
        await this.clientService.updateClientsFromFmcsa();
        await this.clientService.updateClientsFromInactivity();
        break;
      case CronJobType.SyncQuickbooksClients:
        await this.quickbooksService.syncClients();
        break;
      case CronJobType.ScheduledRegularTransfer:
        await this.transferService.initiateRegularTransfer({});
        break;
      default:
        throw new Error(`Cron job type ${jobType} not registered`);
    }
  }
}
