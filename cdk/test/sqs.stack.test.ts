import * as cdk from 'aws-cdk-lib';
import { Duration } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { SQSStack } from '../lib/infrastructure/sqs.stack';
import { envProps } from './test.props';

describe('SQS Stack', () => {
  test('documents queue', () => {
    const app = new cdk.App();
    const sqsStack = new SQSStack(app, 'BobtailSQS', { envProps });

    const template = Template.fromStack(sqsStack);
    template.hasResourceProperties('AWS::SQS::Queue', {
      QueueName: `${envProps.shortName}-documents-queue.fifo`,
      MessageRetentionPeriod: Duration.days(4).toSeconds(),
      VisibilityTimeout: Duration.minutes(5).toSeconds(),
      ContentBasedDeduplication: true,
      DelaySeconds: 0,
    });
  });

  test('sqs documents dlq', () => {
    const app = new cdk.App();
    const sqsStack = new SQSStack(app, 'BobtailSQS', { envProps });

    const template = Template.fromStack(sqsStack);
    template.hasResourceProperties('AWS::SQS::Queue', {
      QueueName: `${envProps.shortName}-documents-dlq.fifo`,
      MessageRetentionPeriod: Duration.days(4).toSeconds(),
    });
  });
});
