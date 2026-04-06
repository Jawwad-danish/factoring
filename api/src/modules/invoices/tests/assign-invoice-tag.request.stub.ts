import { RequestBuilder } from '@core/test';
import { AssignInvoiceActivityRequest } from '../data';
import { TagDefinitionKey } from '@module-persistence/entities';

export class AssignInvoiceTagRequestBuilder extends RequestBuilder<AssignInvoiceActivityRequest> {
  requestSupplier(): AssignInvoiceActivityRequest {
    const request = new AssignInvoiceActivityRequest();
    request.key = TagDefinitionKey.OTHER_INVOICE_ISSUE;
    request.note = 'Other invoice issue';
    request.payload = {};
    return request;
  }
}
