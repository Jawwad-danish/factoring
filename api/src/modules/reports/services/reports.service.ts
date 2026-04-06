import { Injectable, Logger } from '@nestjs/common';
import { WorkerJobType } from '@module-persistence';
import { JobService } from '@module-worker';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly jobEnqueueService: JobService) {}

  async createReport(parameters: any): Promise<void> {
    this.logger.log(
      `Creating report with params ${JSON.stringify(parameters)}`,
    );
    await this.jobEnqueueService.enqueue({
      payload: parameters || {},
      type: WorkerJobType.Report,
    });
  }

  async getReports() {
    this.logger.log('Getting reports');
    return [];
  }
}
