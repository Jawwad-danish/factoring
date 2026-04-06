import { DeleteInvoiceActivityRequest } from '../data';

export const buildStubDeleteInvoiceTagRequest = (
  data?: Partial<DeleteInvoiceActivityRequest>,
): DeleteInvoiceActivityRequest => {
  return new DeleteInvoiceActivityRequest(data);
};
