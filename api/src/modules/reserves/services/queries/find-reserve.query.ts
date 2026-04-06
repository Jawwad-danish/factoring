import { Query } from '@module-cqrs';
import { ReserveEntity } from '@module-persistence/entities';

export interface FindReserveQueryResult {
  reserve: ReserveEntity;
  totalAmount: number;
}

export class FindReserveQuery extends Query<FindReserveQueryResult> {
  constructor(readonly clientId: string, readonly reserveId: string) {
    super();
  }
}
