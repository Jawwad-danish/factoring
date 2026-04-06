import { QueryCriteria } from '@core/data';
import { Query } from '@module-cqrs';
import { ClientPaymentEntity } from '@module-persistence/entities';

export interface FindClientPaymentsQueryResult {
  clientPaymentEntities: ClientPaymentEntity[];
  count: number;
}

export class FindClientPaymentsQuery extends Query<FindClientPaymentsQueryResult> {
  constructor(readonly clientId: string, readonly criteria: QueryCriteria) {
    super();
  }
}
