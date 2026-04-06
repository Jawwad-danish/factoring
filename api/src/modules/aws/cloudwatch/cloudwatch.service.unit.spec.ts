import {
  CloudWatchClient,
  Metric,
  PutMetricDataCommand,
} from '@aws-sdk/client-cloudwatch';

import { mockClient } from 'aws-sdk-client-mock';
import { CloudWatchService } from './cloudwatch.service';

const cloudWatchClientMock = mockClient(CloudWatchClient);

beforeEach(() => {
  cloudWatchClientMock.reset();
});

describe('CloudWatch Client', () => {
  test('Send metric', async () => {
    const service = new CloudWatchService();
    const metric: Metric = {
      Namespace: 'Test/Metric',
      MetricName: 'Test Metric',
    };
    service.sendMetric(metric, 1);
    const commands = cloudWatchClientMock.commandCalls(PutMetricDataCommand, {
      Namespace: 'Test/Metric',
    });
    expect(commands.length).toBeGreaterThan(0);
  });
});
