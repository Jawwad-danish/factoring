import { QueryCriteria } from '@core/data';
import { Query } from '@module-cqrs';
import { AuditLogEntity } from '@module-persistence/entities';

export interface FindAuditLogsQueryResult {
  logs: AuditLogEntity[];
  count: number;
}

export class FindAuditLogsQuery extends Query<FindAuditLogsQueryResult> {
  constructor(readonly criteria: QueryCriteria) {
    super();
  }
}
