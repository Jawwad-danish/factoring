import { RequestBuilder } from '@core/test';
import { DeleteBrokerPaymentRequest } from '../../data';

export class DeleteBrokerPaymentRequestBuilder extends RequestBuilder<DeleteBrokerPaymentRequest> {
  requestSupplier(): DeleteBrokerPaymentRequest {
    return new DeleteBrokerPaymentRequest();
  }
}

export const buildStubDeleteBrokerPaymentRequest = (
  data?: Partial<DeleteBrokerPaymentRequest>,
): DeleteBrokerPaymentRequest => {
  return new DeleteBrokerPaymentRequestBuilder(data).getRequest();
};
