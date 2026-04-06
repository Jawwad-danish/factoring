import { Injectable } from '@nestjs/common';
import { CloudWatchService } from '@module-aws';
import { BasicInvoiceMetricService } from './basic-invoice-metric.service';
import {
  InvoiceDocumentCreateMetric,
  InvoiceDocumentDeleteMetric,
} from './invoice-document-metrics';

export const INVOICE_DOCUMENT_METRIC_VALUE = 1;

@Injectable()
export class InvoiceDocumentMetricService extends BasicInvoiceMetricService {
  constructor(cloudWatchService: CloudWatchService) {
    super(cloudWatchService);
  }

  async sendCreateMetric(): Promise<void> {
    await this.sendMetric(new InvoiceDocumentCreateMetric());
  }

  async sendDeleteMetric() {
    await this.sendMetric(new InvoiceDocumentDeleteMetric());
  }
}
