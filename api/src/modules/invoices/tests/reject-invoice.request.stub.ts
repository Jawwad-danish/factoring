import { RequestBuilder } from '@core/test';
import { TagDefinitionKey } from '@module-persistence/entities';
import { RejectInvoiceRequest } from '../data';

export class RejectInvoiceRequestBuilder extends RequestBuilder<RejectInvoiceRequest> {
  requestSupplier(): RejectInvoiceRequest {
    return new RejectInvoiceRequest({
      key: TagDefinitionKey.LOW_BROKER_CREDIT_RATING,
    });
  }
}
