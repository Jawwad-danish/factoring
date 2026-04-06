import { QueryCriteria } from '@core/data';
import { Query } from '@module-cqrs';
import { ReserveEntity } from '@module-persistence/entities';

export interface FindReservesQueryResult {
  entities: ReserveEntity[];
  totalCount: number;
  totalAmount: number;
}

export class FindReservesQuery extends Query<FindReservesQueryResult> {
  constructor(readonly clientId: string, readonly criteria: QueryCriteria) {
    super();
  }
}
