import { Message } from '@aws-sdk/client-sqs';
import { DatabaseService } from '@module-database';
import {
  WorkerJobEntity,
  WorkerJobRepository,
  WorkerJobStatus,
  WorkerJobType,
} from '@module-persistence';
import { ReportsRunnerService } from '@module-reports/engine';
import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { MESSAGE_CONSUMER, MessageConsumer } from '../consumers';
import { CrossCuttingConcerns } from '@core/util';
import { MessagePayload } from '../data';
import { CronJobRunner } from '@module-cron';
import { NonRetryableError } from '../errors';
import { AppContextHolder } from '@core/app-context';
import { UUID } from '@core/util';

@Injectable()
export class JobWorker implements OnModuleDestroy {
  private readonly logger: Logger = new Logger(JobWorker.name);

  constructor(
    @Inject(MESSAGE_CONSUMER) private readonly messageConsumer: MessageConsumer,
    private readonly databaseService: DatabaseService,
    private readonly jobRepository: WorkerJobRepository,
    private readonly reportsRunnerService: ReportsRunnerService,
    private readonly cronJobRunner: CronJobRunner,
  ) {
    this.messageConsumer.start(this.handleMessage.bind(this));
  }

  @CrossCuttingConcerns({
    logging: (entity: WorkerJobEntity) => {
      return {
        message: `Executing task for job ${entity.id}, job type: ${entity.type}`,
      };
    },
  })
  async executeTask(entity: WorkerJobEntity, data: any): Promise<void> {
    switch (entity.type) {
      case WorkerJobType.Report:
        await this.reportsRunnerService.runReport(entity, data);
        break;
      case WorkerJobType.Cron:
        await this.cronJobRunner.runJob(data);
        break;
      default:
        throw new NonRetryableError(`Unknown job type: ${entity.type}`);
    }
  }

  async onModuleDestroy() {
    this.logger.log(
      `Destroying worker ${this.constructor.name}, stopping consumer...`,
    );
    this.messageConsumer.stop();
  }

  async handleMessage(message: Message): Promise<Message | void> {
    const payload: MessagePayload = JSON.parse(message.Body ?? '');
    const jobId = payload.id;

    let correlationId: string;
    try {
      const entity = await this.jobRepository.getOneById(jobId);
      correlationId = entity.correlationId ?? UUID.get();
    } catch {
      correlationId = UUID.get();
    }

    return this.databaseService.withRequestContext(
      () =>
        new Promise<Message | void>((resolve, reject) => {
          AppContextHolder.createForWorker(correlationId, async () => {
            this.processMessage(message, jobId).then(resolve, reject);
          });
        }),
    );
  }

  private async processMessage(
    message: Message,
    jobId: string,
  ): Promise<Message | void> {
    let entity: WorkerJobEntity | null = null;

    try {
      this.logger.log(
        `Consuming message ${message.MessageId} for job ${
          jobId ?? 'unknown'
        } via ${this.messageConsumer.constructor.name}`,
      );
      if (!message.Body) {
        throw new NonRetryableError('No body found in message');
      }
      if (!jobId) {
        throw new NonRetryableError('Job ID missing in message body');
      }

      const parsedBody = JSON.parse(message.Body);
      entity = await this.jobRepository.getOneById(jobId);

      const receiveCount = parseInt(
        message.Attributes?.ApproximateReceiveCount ?? '1',
        10,
      );

      if (receiveCount > entity.maxAttempts) {
        this.logger.warn(
          `Job ${entity.id} (Message ${message.MessageId}) exceeded max attempts (${entity.maxAttempts}). Marking as FAILED.`,
        );
        await this.updateJobStatus(
          entity,
          WorkerJobStatus.Failed,
          'Job exceeded max attempts',
        );
        return message;
      }

      if (
        entity.status === WorkerJobStatus.Completed ||
        entity.status === WorkerJobStatus.Failed
      ) {
        this.logger.log(
          `Job ${entity.id} already in terminal state ${entity.status}. Skipping.`,
        );
        return message;
      }

      await this.updateJobStatus(entity, WorkerJobStatus.Processing);

      await this.executeTask(entity, parsedBody.data);

      await this.updateJobStatus(entity, WorkerJobStatus.Completed);

      this.logger.log(
        `Successfully processed message ${message.MessageId} for job ${entity.id}`,
      );
      return message;
    } catch (error) {
      this.logger.error(
        `Error handling message ${message.MessageId} for job ${
          jobId ?? 'unknown'
        }: ${error.message}`,
        error.stack,
      );

      if (entity) {
        try {
          await this.updateJobStatus(
            entity,
            WorkerJobStatus.Failed,
            `Processing failed: ${error.message}`,
          );
        } catch (persistError) {
          this.logger.error(
            `Failed to mark job ${entity.id} as FAILED after initial error: ${persistError.message}`,
            persistError.stack,
          );
        }
      }

      if (error instanceof NonRetryableError) {
        this.logger.warn(
          `Job ${jobId} (Message ${message.MessageId}) will not be retried due to non-retryable error: ${error.message}`,
        );
        return message;
      }

      throw error;
    }
  }

  private async updateJobStatus(
    entity: WorkerJobEntity,
    status: WorkerJobStatus,
    errorMessage?: string,
  ): Promise<void> {
    entity.status = status;
    entity.errorMessage = errorMessage ?? undefined;
    await this.jobRepository.persistAndFlush(entity);
  }
}
