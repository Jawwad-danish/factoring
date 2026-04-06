import { Query } from '@module-cqrs';
import { ClientPaymentEntity } from '@module-persistence/entities';

export interface FindClientPaymentQueryResult {
  clientPaymentEntity: ClientPaymentEntity;
}

export class FindClientPaymentQuery extends Query<FindClientPaymentQueryResult> {
  constructor(readonly clientId: string, readonly paymentId: string) {
    super();
  }
}
