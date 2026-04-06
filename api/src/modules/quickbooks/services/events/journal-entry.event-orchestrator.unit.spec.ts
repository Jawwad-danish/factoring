import { createMock } from '@golevelup/ts-jest';
import { FeatureFlagResolver } from '@module-common';
import { DatabaseService } from '@module-database';
import { EntityStubs } from '@module-persistence';
import { QuickbooksJournalEntryType } from '@module-persistence/entities';
import {
  ClientBatchPaymentRepository,
  Repositories,
} from '@module-persistence/repositories';
import { TransferCreated } from '@module-transfers/data';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BatchPaymentsJournalEntryStrategy,
  JournalEntryStrategyFactory,
} from '../journal-entries/strategies';
import { JournalEntryEventOrchestrator } from './journal-entry.event-orchestrator';

describe('JournalEntryEventOrchestrator', () => {
  let orchestrator: JournalEntryEventOrchestrator;
  const databaseService = createMock<DatabaseService>();
  const clientBatchPaymentRepository =
    createMock<ClientBatchPaymentRepository>();
  const repositories = createMock<Repositories>({
    clientBatchPayment: clientBatchPaymentRepository,
  });
  const strategyFactory = createMock<JournalEntryStrategyFactory>();
  const featureFlagResolver = createMock<FeatureFlagResolver>();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JournalEntryEventOrchestrator,
        {
          provide: DatabaseService,
          useValue: databaseService,
        },
        {
          provide: Repositories,
          useValue: repositories,
        },
        {
          provide: JournalEntryStrategyFactory,
          useValue: strategyFactory,
        },
        {
          provide: FeatureFlagResolver,
          useValue: featureFlagResolver,
        },
      ],
    }).compile();

    orchestrator = module.get(JournalEntryEventOrchestrator);

    databaseService.withRequestContext.mockImplementation(async (fn) => {
      return await fn();
    });

    featureFlagResolver.isEnabled.mockReturnValue(true);
  });

  it('should be defined', () => {
    expect(orchestrator).toBeDefined();
  });

  it('should handle TransferCreated event', async () => {
    const transfer = EntityStubs.buildStubClientBatchPayment();
    const event = new TransferCreated(transfer.id);
    const strategy = createMock<BatchPaymentsJournalEntryStrategy>();

    clientBatchPaymentRepository.getOneById.mockResolvedValue(transfer);
    strategyFactory.getStrategy.mockReturnValue(strategy);
    strategy.upsertJournalEntry.mockResolvedValue(
      EntityStubs.buildStubJournalEntry(),
    );

    await orchestrator.handleTransferCreated(event);

    expect(clientBatchPaymentRepository.getOneById).toHaveBeenCalledWith(
      transfer.id,
      expect.any(Object),
    );
    expect(strategyFactory.getStrategy).toHaveBeenCalledWith(
      QuickbooksJournalEntryType.BatchPayment,
    );
    expect(strategy.upsertJournalEntry).toHaveBeenCalledWith(transfer);
  });
});
