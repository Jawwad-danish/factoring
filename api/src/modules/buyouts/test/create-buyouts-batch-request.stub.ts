import { RequestBuilder } from '@core/test';
import { CreateBuyoutsBatchRequest } from '@fs-bobtail/factoring/data';

export const buildStubCreateBuyoutsBatchRequest = (
  data?: Partial<CreateBuyoutsBatchRequest>,
): CreateBuyoutsBatchRequest => {
  return new CreateBuyoutsBatchRequestBuilder(data).getRequest();
};

export class CreateBuyoutsBatchRequestBuilder extends RequestBuilder<CreateBuyoutsBatchRequest> {
  requestSupplier(): CreateBuyoutsBatchRequest {
    return new CreateBuyoutsBatchRequest();
  }
}
