import { BrokerPaymentType } from '@module-persistence/entities';
import { UpdateBrokerPaymentRequest } from '../../data';

export const buildStubUpdateBrokerPaymentRequest = (
  data?: Partial<UpdateBrokerPaymentRequest>,
): UpdateBrokerPaymentRequest => {
  const request = new UpdateBrokerPaymentRequest({
    type: BrokerPaymentType.Check,
    checkNumber: 'check10',
    batchDate: new Date('01-01-2000'),
  });
  Object.assign(request, data);
  return request;
};
