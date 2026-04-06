import { UUID } from '@core/uuid';
import { InvoiceTaggedEvent } from '../../data/events';
import { AssignInvoiceTagRequestBuilder } from '../assign-invoice-tag.request.stub';

export const buildStubInvoiceTaggedEvent = (
  data?: Partial<InvoiceTaggedEvent>,
): InvoiceTaggedEvent => {
  const event = new InvoiceTaggedEvent();
  event.invoiceId = UUID.get();
  event.request = new AssignInvoiceTagRequestBuilder().getRequest();
  if (data) {
    Object.assign(event, data);
  }
  return event;
};
