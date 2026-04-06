import { RequestBuilder } from '@core/test';
import { VerificationStatus } from '@module-persistence/entities';
import { ContactType, VerifyInvoiceRequest } from '../data';

export class VerifyInvoiceRequestBuilder extends RequestBuilder<VerifyInvoiceRequest> {
  requestSupplier(): VerifyInvoiceRequest {
    const request = new VerifyInvoiceRequest();
    request.notes = 'Verification bypass';
    request.status = VerificationStatus.Verified;
    request.contactPerson = 'person';
    request.contactType = ContactType.Email;
    return request;
  }
}
