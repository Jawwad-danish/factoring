import { RequestBuilderMixin } from '@core/test';
import Big from 'big.js';
import { UpdateBuyoutRequest } from '@fs-bobtail/factoring/data';

export class UpdateBuyoutRequestBuilder extends RequestBuilderMixin<UpdateBuyoutRequest>(
  () => {
    return new UpdateBuyoutRequest({
      loadNumber: 'LOAD-001',
      paymentDate: new Date(),
      rate: Big(100),
      brokerName: 'Test Broker',
    });
  },
) {}
