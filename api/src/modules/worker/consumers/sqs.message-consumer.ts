import { environment } from '@core/environment';
import { Logger, OnApplicationShutdown } from '@nestjs/common';
import { Consumer } from 'sqs-consumer';
import { MessageConsumer, MessageHandler } from './message-consumer';

export class SqsMessageConsumer
  implements MessageConsumer, OnApplicationShutdown
{
  private consumer: Consumer | null = null;
  private readonly logger = new Logger(SqsMessageConsumer.name);
  private isShuttingDown = false;

  constructor(
    private readonly queueUrl: string,
    private readonly visibilityTimeout = 3600,
  ) {}

  start(handleMessage: MessageHandler): void {
    if (this.consumer) {
      this.logger.warn(`Consumer for jobs already started.`);
      return;
    }
    this.logger.log(`Starting SQS consumer for queue jobs`);
    this.consumer = Consumer.create({
      region: environment.aws.defaultRegion(),
      queueUrl: this.queueUrl,
      handleMessage: handleMessage,
      visibilityTimeout: this.visibilityTimeout,
      messageSystemAttributeNames: ['ApproximateReceiveCount'],
    });

    this.consumer.on('error', (err) => {
      this.logger.error(
        `SQS Consumer Error for queue jobs: ${err.message}`,
        err.stack,
      );
    });

    this.consumer.on('processing_error', (err, message) => {
      this.logger.error(
        `SQS Processing Error for message ${message?.MessageId} on queue jobs: ${err.message}`,
        err.stack,
      );
    });

    this.consumer.on('stopped', () => {
      if (!this.isShuttingDown) {
        this.logger.warn(
          `SQS Consumer for jobs stopped unexpectedly. Ensure your deployment orchestrator handles restarts.`,
        );
      } else {
        this.logger.log(`SQS Consumer for jobs stopped gracefully.`);
      }
    });

    this.consumer.start();
  }

  stop(): void {
    if (this.consumer && !this.isShuttingDown) {
      this.logger.log(`Stopping SQS consumer for queue ${this.queueUrl}`);
      this.isShuttingDown = true;
      this.consumer.stop();
      this.consumer = null;
    }
  }

  onApplicationShutdown() {
    this.stop();
  }
}
