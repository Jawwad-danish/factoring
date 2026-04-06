import { Command } from '@module-cqrs';

export class SyncJournalEntryCommand extends Command<void> {
  constructor(readonly journalEntryId: string) {
    super();
  }
}
