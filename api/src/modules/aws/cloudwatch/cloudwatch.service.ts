import { Injectable, Logger } from '@nestjs/common';
import {
  CloudWatchClient,
  Metric,
  MetricDatum,
  PutMetricDataCommand,
  PutMetricDataCommandOutput,
} from '@aws-sdk/client-cloudwatch';
import { environment } from '@core/environment';

@Injectable()
export class CloudWatchService {
  private readonly client: CloudWatchClient = new CloudWatchClient({
    region: environment.aws.defaultRegion(),
  });
  private readonly logger: Logger = new Logger(CloudWatchService.name);

  private generateMetricDatum(metric: Metric, value: number): MetricDatum {
    return {
      MetricName: metric.MetricName,
      Value: value,
      Dimensions: [
        {
          Name: 'Environment',
          Value: environment.core.nodeEnv(),
        },
      ],
    };
  }

  async sendMetric(
    metric: Metric,
    value: number,
  ): Promise<PutMetricDataCommandOutput> {
    try {
      const datum = this.generateMetricDatum(metric, value);
      const command = new PutMetricDataCommand({
        Namespace: metric.Namespace,
        MetricData: [datum],
      });
      this.logger.log(
        `Sending metric ${metric.MetricName} to namespace ${metric.Namespace}`,
      );
      const result = this.client.send(command);
      this.logger.log(
        `Metric ${metric.MetricName} was sent successfully to namespace ${metric.Namespace}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Could not send metric ${metric.MetricName} to namespace ${metric.Namespace}`,
        error,
      );
      throw error;
    }
  }
}
