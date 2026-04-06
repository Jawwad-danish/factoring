import { RequestBuilder } from '@core/test';
import { BrokerPaymentType } from '@module-persistence/entities';
import Big from 'big.js';
import { UUID } from '@core/uuid';
import { CreateBrokerPaymentRequest } from '@module-broker-payments/data';

export const buildStubCreateBrokerPaymentRequest = (
  data?: Partial<CreateBrokerPaymentRequest>,
): CreateBrokerPaymentRequest => {
  return new CreateBrokerPaymentRequestBuilder(data).getRequest();
};

export class CreateBrokerPaymentRequestBuilder extends RequestBuilder<CreateBrokerPaymentRequest> {
  requestSupplier(): CreateBrokerPaymentRequest {
    return new CreateBrokerPaymentRequest({
      amount: new Big(100),
      batchDate: new Date(),
      checkNumber: '1',
      invoiceId: UUID.get(),
      type: BrokerPaymentType.Ach,
    });
  }
}
