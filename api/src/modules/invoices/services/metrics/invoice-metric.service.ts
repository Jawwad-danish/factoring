import { Injectable } from '@nestjs/common';
import { CloudWatchService } from '@module-aws';
import { BasicInvoiceMetricService } from './basic-invoice-metric.service';
import {
  InvoiceCreateMetric,
  InvoiceDeleteMetric,
  InvoiceUpdateMetric,
} from './invoice-metrics';

@Injectable()
export class InvoiceMetricService extends BasicInvoiceMetricService {
  constructor(cloudWatchService: CloudWatchService) {
    super(cloudWatchService);
  }

  async sendCreateMetric(): Promise<void> {
    await this.sendMetric(new InvoiceCreateMetric());
  }

  async sendUpdateMetric() {
    await this.sendMetric(new InvoiceUpdateMetric());
  }

  async sendDeleteMetric() {
    await this.sendMetric(new InvoiceDeleteMetric());
  }
}
