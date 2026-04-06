import { UUID } from '@core/uuid';
import { InvoiceRejectedEvent } from '../../data/events';
import { RejectInvoiceRequestBuilder } from '../reject-invoice.request.stub';

export const buildStubInvoiceRejectedEvent = (
  data?: Partial<InvoiceRejectedEvent>,
): InvoiceRejectedEvent => {
  const event = new InvoiceRejectedEvent();
  event.invoiceId = UUID.get();
  event.request = new RejectInvoiceRequestBuilder().getRequest();
  if (data) {
    Object.assign(event, data);
  }
  return event;
};
