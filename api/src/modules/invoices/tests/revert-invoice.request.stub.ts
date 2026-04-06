import { RequestBuilderMixin } from '@core/test';
import { RevertInvoiceRequest } from '../data/web';
export class RevertInvoiceRequestBuilder extends RequestBuilderMixin<RevertInvoiceRequest>(
  () => {
    return new RevertInvoiceRequest();
  },
) {}
