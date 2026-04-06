import { QueryCriteria } from '@core/data';
import { Query } from '@module-cqrs';
import { QuickbooksJournalEntryEntity } from '@module-persistence/entities';

export interface FindJournalEntriesQueryResult {
  entities: QuickbooksJournalEntryEntity[];
  count: number;
}

export class FindJournalEntriesQuery extends Query<FindJournalEntriesQueryResult> {
  constructor(readonly criteria: QueryCriteria) {
    super();
  }
}
