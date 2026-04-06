import {
  BrokerPaymentEntity,
  QuickbooksJournalEntryType,
  Repositories,
} from '@module-persistence';
import { QuickbooksJournalEntryEntity } from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';
import { BaseJournalEntryStrategy } from './base.journal-entry.strategy';
import { IJournalEntryStrategy } from './ijournal-entry.strategy';

@Injectable()
export class BrokerPaymentsJournalEntryStrategy
  extends BaseJournalEntryStrategy<BrokerPaymentEntity>
  implements IJournalEntryStrategy<BrokerPaymentEntity>
{
  constructor(repositories: Repositories) {
    super(repositories);
  }
  getEntryType(): QuickbooksJournalEntryType {
    return QuickbooksJournalEntryType.BrokerPayment;
  }

  async upsertJournalEntry(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _brokerPayment: BrokerPaymentEntity,
  ): Promise<QuickbooksJournalEntryEntity> {
    throw new Error('Method not implemented');
  }
}
