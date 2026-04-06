import { RequestBuilderMixin } from '@core/test';
import { DeleteInvoiceRequest } from '../data/web';
export class DeleteInvoiceRequestBuilder extends RequestBuilderMixin<DeleteInvoiceRequest>(
  () => {
    return new DeleteInvoiceRequest();
  },
) {}
