import { Metric } from '@aws-sdk/client-cloudwatch';
import { StandardMetric } from '@module-aws';

export const INVOICE_CREATE_METRIC_NAME = 'CreateInvoice';
export const INVOICE_UPDATE_METRIC_NAME = 'UpdateInvoice';
export const INVOICE_DELETE_METRIC_NAME = 'DeleteInvoice';

export class InvoiceCreateMetric extends StandardMetric implements Metric {
  constructor() {
    super(INVOICE_CREATE_METRIC_NAME);
  }
}

export class InvoiceUpdateMetric extends StandardMetric implements Metric {
  constructor() {
    super(INVOICE_UPDATE_METRIC_NAME);
  }
}

export class InvoiceDeleteMetric extends StandardMetric implements Metric {
  constructor() {
    super(INVOICE_DELETE_METRIC_NAME);
  }
}
