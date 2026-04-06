import { RequestBuilderMixin } from '@core/test';
import { UpdateInvoiceDocumentRequest } from '../data';

export class UpdateInvoiceDocumentRequestBuilder extends RequestBuilderMixin<UpdateInvoiceDocumentRequest>(
  () => {
    return new UpdateInvoiceDocumentRequest();
  },
) {}
