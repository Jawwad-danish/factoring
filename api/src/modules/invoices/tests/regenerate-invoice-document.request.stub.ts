import { RequestBuilderMixin } from '@core/test';
import { RegenerateInvoiceDocumentRequest } from '../data/web';

export class RegenerateInvoiceDocumentRequestBuilder extends RequestBuilderMixin<RegenerateInvoiceDocumentRequest>(
  () => {
    return new RegenerateInvoiceDocumentRequest();
  },
) {}
