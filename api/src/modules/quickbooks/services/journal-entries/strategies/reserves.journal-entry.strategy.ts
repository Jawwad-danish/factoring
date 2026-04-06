import {
  QuickbooksJournalEntryType,
  Repositories,
  ReserveEntity,
} from '@module-persistence';
import { QuickbooksJournalEntryEntity } from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';
import { BaseJournalEntryStrategy } from './base.journal-entry.strategy';
import { IJournalEntryStrategy } from './ijournal-entry.strategy';

@Injectable()
export class ReservesJournalEntryStrategy
  extends BaseJournalEntryStrategy<ReserveEntity>
  implements IJournalEntryStrategy<ReserveEntity>
{
  constructor(repositories: Repositories) {
    super(repositories);
  }
  getEntryType(): QuickbooksJournalEntryType {
    return QuickbooksJournalEntryType.Reserve;
  }

  async upsertJournalEntry(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _reserve: ReserveEntity,
  ): Promise<QuickbooksJournalEntryEntity> {
    throw new Error('Method not implemented');
  }
}
