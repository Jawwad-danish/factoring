import { QuickbooksJournalEntryType } from '@module-persistence';
import { Injectable } from '@nestjs/common';
import { BatchPaymentsJournalEntryStrategy } from './batch-payments.journal-entry.strategy';
import { BrokerPaymentsJournalEntryStrategy } from './broker-payments.journal-entry.strategy';
import { ReservesJournalEntryStrategy } from './reserves.journal-entry.strategy';

@Injectable()
export class JournalEntryStrategyFactory {
  constructor(
    private reserveStrategy: ReservesJournalEntryStrategy,
    private brokerPaymentStrategy: BrokerPaymentsJournalEntryStrategy,
    private batchPaymentStrategy: BatchPaymentsJournalEntryStrategy,
  ) {}

  getStrategy(
    entryType: QuickbooksJournalEntryType.Reserve,
  ): ReservesJournalEntryStrategy;

  getStrategy(
    entryType: QuickbooksJournalEntryType.BrokerPayment,
  ): BrokerPaymentsJournalEntryStrategy;

  getStrategy(
    entryType: QuickbooksJournalEntryType.BatchPayment,
  ): BatchPaymentsJournalEntryStrategy;

  getStrategy(
    entryType: QuickbooksJournalEntryType,
  ):
    | ReservesJournalEntryStrategy
    | BrokerPaymentsJournalEntryStrategy
    | BatchPaymentsJournalEntryStrategy {
    switch (entryType) {
      case QuickbooksJournalEntryType.Reserve:
        return this.reserveStrategy;
      case QuickbooksJournalEntryType.BrokerPayment:
        return this.brokerPaymentStrategy;
      case QuickbooksJournalEntryType.BatchPayment:
        return this.batchPaymentStrategy;
      default:
        throw new Error(`Unknown entry type: ${entryType}`);
    }
  }
}
