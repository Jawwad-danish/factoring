import { QueryCriteria } from '@core/data';
import { Query } from '@module-cqrs';
import { ReserveAccountFundsEntity } from '@module-persistence/entities';

export interface FindReserveAccountFundsQueryResult {
  entities: ReserveAccountFundsEntity[];
  totalCount: number;
}

export class FindReserveAccountFundsQuery extends Query<FindReserveAccountFundsQueryResult> {
  constructor(readonly clientId: string, readonly criteria: QueryCriteria) {
    super();
  }
}
