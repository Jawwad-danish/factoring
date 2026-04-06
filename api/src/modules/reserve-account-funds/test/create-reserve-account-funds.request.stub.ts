import { RequestBuilderMixin } from '@core/test';
import { CreateReserveAccountFundsRequest } from '../data';

export class CreateReserveAccountFundsRequestBuilder extends RequestBuilderMixin<CreateReserveAccountFundsRequest>(
  () => {
    return new CreateReserveAccountFundsRequest();
  },
) {}
