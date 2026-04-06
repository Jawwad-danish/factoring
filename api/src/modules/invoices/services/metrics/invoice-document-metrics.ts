import { Metric } from '@aws-sdk/client-cloudwatch';
import { StandardMetric } from '@module-aws';

export const INVOICE_CREATE_METRIC_NAME = 'CreateInvoiceDocument';
export const INVOICE_DELETE_METRIC_NAME = 'DeleteInvoiceDocument';

export class InvoiceDocumentCreateMetric
  extends StandardMetric
  implements Metric
{
  constructor() {
    super(INVOICE_CREATE_METRIC_NAME);
  }
}

export class InvoiceDocumentDeleteMetric
  extends StandardMetric
  implements Metric
{
  constructor() {
    super(INVOICE_DELETE_METRIC_NAME);
  }
}
