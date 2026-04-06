import { BaseReport } from '../util';

interface Job {
  invoiceId: string;
  jobId: string;
  status: string;
  payload?: any;
}

interface JobStats {
  count: number;
  items: object[];
}

export class PeruseReport extends BaseReport {
  private readonly jobs: Job[] = [];

  addJob(job: Job) {
    this.jobs.push(job);
  }

  asJson(): object {
    const result: Record<string, JobStats> = {};
    for (const job of this.jobs) {
      let jobStats = result[job.status];
      if (!jobStats) {
        jobStats = {
          count: 0,
          items: [],
        };
        result[job.status] = jobStats;
      }
      jobStats.count++;
      jobStats.items.push({
        invoiceId: job.invoiceId,
        jobId: job.jobId,
        payload: job.payload,
      });
    }
    return result;
  }

  hasItems(): boolean {
    return this.jobs.length !== 0;
  }
}
