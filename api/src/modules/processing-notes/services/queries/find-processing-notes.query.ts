import { QueryCriteria } from '@core/data';
import { Query } from '@module-cqrs';
import { ProcessingNotesEntity } from '@module-persistence';

export interface FindProcessingNotesQueryResult {
  entities: ProcessingNotesEntity[];
  count: number;
}

export class FindProcessingNotesQuery extends Query<FindProcessingNotesQueryResult> {
  constructor(readonly criteria: QueryCriteria) {
    super();
  }
}
