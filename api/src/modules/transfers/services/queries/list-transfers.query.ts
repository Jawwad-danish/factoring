import { Query } from '@module-cqrs';
import { QueryCriteria } from '@core/data';
import { ListTransfersPaymentsResponse } from '@fs-bobtail/factoring/data';

export class ListTransfersQuery extends Query<ListTransfersPaymentsResponse> {
  constructor(readonly criteria: QueryCriteria) {
    super();
  }
}
