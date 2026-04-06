import {
  QuickbooksJournalEntryEntity,
  QuickbooksJournalEntryStatus,
  QuickbooksJournalEntryType,
  Repositories,
} from '@module-persistence';
import dayjs from 'dayjs';
import { IJournalEntryStrategy } from './ijournal-entry.strategy';

export abstract class BaseJournalEntryStrategy<TInput = any>
  implements IJournalEntryStrategy<TInput>
{
  constructor(protected readonly repositories: Repositories) {}

  abstract getEntryType(): QuickbooksJournalEntryType;
  abstract upsertJournalEntry(
    input: TInput,
  ): Promise<QuickbooksJournalEntryEntity>;

  protected createNewJournalEntry(
    batchDate: Date,
    docName: string,
  ): QuickbooksJournalEntryEntity {
    const journalEntry = new QuickbooksJournalEntryEntity();
    journalEntry.businessDay = dayjs(batchDate).format('YYYY-MM-DD');

    journalEntry.docName = docName;
    journalEntry.status = QuickbooksJournalEntryStatus.Pending;
    journalEntry.type = this.getEntryType();
    return journalEntry;
  }
}
