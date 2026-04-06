import { Query } from '@module-cqrs';
import { ClientBrokerAssignmentEntity } from '@module-persistence';

export interface FindClientBrokerAssignmentQueryResult {
  entity: ClientBrokerAssignmentEntity;
}

export class FindClientBrokerAssignmentQuery extends Query<FindClientBrokerAssignmentQueryResult> {
  constructor(readonly clientBrokerAssignmentId: string) {
    super();
  }
}
