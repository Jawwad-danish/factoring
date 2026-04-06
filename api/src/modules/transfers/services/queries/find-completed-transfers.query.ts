import { QueryCriteria } from '@core/data';
import { Query } from '@module-cqrs';
import { ClientBatchPaymentEntity } from '@module-persistence/entities';

export interface FindCompletedTransfersQueryResult {
  batchPayments: ClientBatchPaymentEntity[];
  count: number;
}

export class FindCompletedTransfersQuery extends Query<FindCompletedTransfersQueryResult> {
  constructor(readonly criteria: QueryCriteria) {
    super();
  }
}
