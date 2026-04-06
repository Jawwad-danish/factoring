import { RequestBuilderMixin } from '@core/test';
import { DeleteReserveRequest } from '../data';
export class DeleteReserveRequestBuilder extends RequestBuilderMixin<DeleteReserveRequest>(
  () => {
    return new DeleteReserveRequest();
  },
) {}
