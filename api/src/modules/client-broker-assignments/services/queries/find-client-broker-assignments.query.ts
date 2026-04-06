import { QueryCriteria } from '@core/data';
import { Query } from '@module-cqrs';
import { ClientBrokerAssignmentEntity } from '@module-persistence';

export interface FindClientBrokerAssignmentsQueryResult {
  entities: ClientBrokerAssignmentEntity[];
  count: number;
}

export class FindClientBrokerAssignmentsQuery extends Query<FindClientBrokerAssignmentsQueryResult> {
  constructor(readonly criteria: QueryCriteria) {
    super();
  }
}
