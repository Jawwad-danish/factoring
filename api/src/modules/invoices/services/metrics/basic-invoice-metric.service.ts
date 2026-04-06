import { Metric } from '@aws-sdk/client-cloudwatch';
import { Logger } from '@nestjs/common';
import { CloudWatchService } from '@module-aws';

export abstract class BasicInvoiceMetricService {
  private logger: Logger = new Logger(BasicInvoiceMetricService.name);

  constructor(private readonly cloudWatchService: CloudWatchService) {}

  getMetricValue(): number {
    return 1;
  }

  protected async sendMetric(metric: Metric) {
    try {
      const result = await this.cloudWatchService.sendMetric(
        metric,
        this.getMetricValue(),
      );
      this.logger.log(
        `${metric.MetricName} metric sent successfully`,
        result.$metadata,
      );
    } catch (err) {
      this.logger.error(`Error sending ${metric.MetricName} metric`);
    }
  }
}
