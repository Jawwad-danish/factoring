import {
  Entity,
  Enum,
  Index,
  Property,
  OneToMany,
  Collection,
} from '@mikro-orm/core';
import { BasicMutableEntity } from './basic-mutable.entity';
import { QuickbooksJournalEntryLineEntity } from './quickbooks-journal-entry-line.entity';

export enum QuickbooksJournalEntryStatus {
  Pending = 'pending',
  Synced = 'synced',
  Failed = 'failed',
}

export enum QuickbooksJournalEntryType {
  BatchPayment = 'batch_payment',
  Reserve = 'reserve',
  BrokerPayment = 'broker_payment',
}

@Entity({ tableName: 'quickbooks_journal_entries' })
export class QuickbooksJournalEntryEntity extends BasicMutableEntity {
  @Index()
  @Property({ type: 'text', nullable: false })
  docName: string;

  @Index()
  @Property({ type: 'text', nullable: true })
  quickbooksId?: string;

  @Property({
    type: 'timestamp',
    length: 3,
    nullable: true,
  })
  syncedAt?: Date;

  @Enum({
    items: () => QuickbooksJournalEntryType,
    nullable: false,
  })
  type: QuickbooksJournalEntryType;

  @Property({ type: 'text', nullable: false })
  businessDay: string;

  @Enum({
    items: () => QuickbooksJournalEntryStatus,
    default: QuickbooksJournalEntryStatus.Pending,
    nullable: false,
  })
  status: QuickbooksJournalEntryStatus;

  @OneToMany(
    () => QuickbooksJournalEntryLineEntity,
    (line) => line.journalEntry,
    {
      orphanRemoval: true,
      eager: false,
    },
  )
  lines = new Collection<QuickbooksJournalEntryLineEntity>(this);
}
