import {
  WorkerJobEntity,
  WorkerJobRepository,
  WorkerJobStatus,
} from '@module-persistence';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { WorkerJobInput } from '../data';
import { MESSAGE_PRODUCER, MessageProducer } from '../producers';
import { AppContextHolder } from '@core/app-context';
import { UUID } from '@core/util';

@Injectable()
export class JobService {
  protected readonly logger: Logger = new Logger(JobService.name);

  constructor(
    @Inject(MESSAGE_PRODUCER)
    protected readonly messageProducer: MessageProducer,
    protected readonly workerJobRepository: WorkerJobRepository,
  ) {}

  async enqueue(jobInput: WorkerJobInput<any>): Promise<WorkerJobEntity> {
    let job: WorkerJobEntity | null = null;
    try {
      job = await this.workerJobRepository.persistAndFlush(
        this.createJobEntity(jobInput),
      );

      await this.messageProducer.sendMessage({
        id: job.id,
        data: jobInput.payload,
      });

      this.logger.log(`Successfully enqueued job ${job.type} (ID: ${job.id})`);
      return job;
    } catch (error) {
      this.logger.error(
        `Failed to enqueue job ${jobInput.type}: ${error.message}`,
        error.stack,
      );
      if (job && job.id) {
        try {
          job.status = WorkerJobStatus.Failed;
          job.errorMessage = error.message;
          await this.workerJobRepository.persistAndFlush(job);
        } catch (saveError) {
          this.logger.error(
            `Additionally failed to update job ${job.id} status to FAILED: ${saveError.message}`,
          );
        }
      }
      throw error;
    }
  }

  private createJobEntity<T extends object>(
    jobInput: WorkerJobInput<T>,
  ): WorkerJobEntity {
    const workerJob = new WorkerJobEntity();
    workerJob.payload = jobInput.payload;
    workerJob.type = jobInput.type;
    workerJob.status = WorkerJobStatus.Pending;
    workerJob.correlationId =
      AppContextHolder.get().correlationId || UUID.get();
    return workerJob;
  }
}
