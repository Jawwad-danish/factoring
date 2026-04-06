import { mockMikroORMProvider } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import { ExpediteConfigurer } from '@module-common';
import { Repositories } from '@module-persistence';
import { QuickbooksJournalEntryType } from '@module-persistence/entities';
import { Test, TestingModule } from '@nestjs/testing';
import { BatchPaymentsJournalEntryStrategy } from './batch-payments.journal-entry.strategy';
import { BrokerPaymentsJournalEntryStrategy } from './broker-payments.journal-entry.strategy';
import { JournalEntryStrategyFactory } from './journal-entry.strategy-factory';
import { ReservesJournalEntryStrategy } from './reserves.journal-entry.strategy';

describe('JournalEntryStrategyFactory', () => {
  let factory: JournalEntryStrategyFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JournalEntryStrategyFactory,
        ReservesJournalEntryStrategy,
        BrokerPaymentsJournalEntryStrategy,
        BatchPaymentsJournalEntryStrategy,
        mockMikroORMProvider,
        {
          provide: Repositories,
          useValue: createMock<Repositories>(),
        },
        {
          provide: ExpediteConfigurer,
          useValue: createMock<ExpediteConfigurer>(),
        },
      ],
    }).compile();

    factory = module.get(JournalEntryStrategyFactory);
  });

  it('should be defined', () => {
    expect(factory).toBeDefined();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return ReserveStrategy for Reserve entry type', () => {
    const strategy = factory.getStrategy(QuickbooksJournalEntryType.Reserve);
    expect(strategy).toBeInstanceOf(ReservesJournalEntryStrategy);
  });

  it('should return BrokerPaymentStrategy for BrokerPayment entry type', () => {
    const strategy = factory.getStrategy(
      QuickbooksJournalEntryType.BrokerPayment,
    );
    expect(strategy).toBeInstanceOf(BrokerPaymentsJournalEntryStrategy);
  });

  it('should return BatchPaymentStrategy for BatchPayment entry type', () => {
    const strategy = factory.getStrategy(
      QuickbooksJournalEntryType.BatchPayment,
    );
    expect(strategy).toBeInstanceOf(BatchPaymentsJournalEntryStrategy);
  });
});
