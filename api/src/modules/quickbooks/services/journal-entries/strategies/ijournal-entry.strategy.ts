import {
  QuickbooksJournalEntryEntity,
  QuickbooksJournalEntryType,
} from '@module-persistence';

export interface IJournalEntryStrategy<TInput = any> {
  getEntryType(): QuickbooksJournalEntryType;
  upsertJournalEntry(input: TInput): Promise<QuickbooksJournalEntryEntity>;
}
