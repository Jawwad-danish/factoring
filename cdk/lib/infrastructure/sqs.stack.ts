import * as cdk from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { EnvProps } from '../cdk.config';

export interface SQSStackProps extends cdk.StackProps {
  envProps: EnvProps;
}

export class SQSStack extends cdk.Stack {
  readonly documentsQueue: sqs.Queue;
  readonly documentsDeadLetterQueue: sqs.Queue;
  readonly crossAccountQueue: sqs.Queue;
  readonly crossAccountDeadLetterQueue: sqs.Queue;
  readonly workerJobsQueue: sqs.Queue;
  readonly workerJobsDeadLetterQueue: sqs.Queue;

  constructor(scope: cdk.App, id: string, private props: SQSStackProps) {
    super(scope, id, props);

    this.documentsDeadLetterQueue = this.buildDocumentsDLQueue();
    this.documentsQueue = this.buildDocumentsQueue(
      this.documentsDeadLetterQueue,
    );
    this.workerJobsDeadLetterQueue = this.buildWorkerJobsDLQ();
    this.workerJobsQueue = this.buildWorkerJobsQueue(
      this.workerJobsDeadLetterQueue,
    );
  }

  private buildWorkerJobsDLQ(): sqs.Queue {
    return new sqs.Queue(
      this,
      `${this.props.envProps.shortName}-workerJobsDeadLetterQueue`,
      {
        queueName: `${this.props.envProps.shortName}-worker-jobs-dlq.fifo`,
        fifo: true,
        contentBasedDeduplication: true,
        retentionPeriod: cdk.Duration.days(4),
      },
    );
  }

  private buildWorkerJobsQueue(deadLetterQueue: sqs.Queue): sqs.Queue {
    return new sqs.Queue(
      this,
      `${this.props.envProps.shortName}-workerJobsQueue`,
      {
        queueName: `${this.props.envProps.shortName}-worker-jobs-queue.fifo`,
        fifo: true,
        contentBasedDeduplication: true,
        visibilityTimeout: cdk.Duration.minutes(60),
        retentionPeriod: cdk.Duration.days(4),
        deliveryDelay: cdk.Duration.millis(0),
        deadLetterQueue: {
          maxReceiveCount: 1,
          queue: deadLetterQueue,
        },
      },
    );
  }

  private buildDocumentsDLQueue(): sqs.Queue {
    return new sqs.Queue(
      this,
      `${this.props.envProps.shortName}-documentsDeadLetterQueue`,
      {
        queueName: `${this.props.envProps.shortName}-documents-dlq.fifo`,
        contentBasedDeduplication: true,
        retentionPeriod: cdk.Duration.days(4),
        fifo: true,
      },
    );
  }

  private buildDocumentsQueue(deadLetterQueue: sqs.Queue): sqs.Queue {
    return new sqs.Queue(
      this,
      `${this.props.envProps.shortName}-documentsQueue`,
      {
        queueName: `${this.props.envProps.shortName}-documents-queue.fifo`,
        fifo: true,
        contentBasedDeduplication: true,
        visibilityTimeout: cdk.Duration.minutes(5),
        retentionPeriod: cdk.Duration.days(4),
        deliveryDelay: cdk.Duration.millis(0),
        deadLetterQueue: {
          maxReceiveCount: 1,
          queue: deadLetterQueue,
        },
      },
    );
  }
}
