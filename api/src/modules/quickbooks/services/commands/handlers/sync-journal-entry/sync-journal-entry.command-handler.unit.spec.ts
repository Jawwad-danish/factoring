import { JournalEntry } from '@balancer-team/quickbooks/dist/schemas';
import { ValidationError } from '@core/validation';
import { createMock } from '@golevelup/ts-jest';
import { EntityStubs, QuickbooksJournalEntryStatus } from '@module-persistence';
import { QuickbooksJournalEntryRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import {
  QuickbooksApi,
  QuickbooksJournalEntryApiMapper,
} from '../../../../api';
import { SyncJournalEntryCommand } from '../../sync-journal-entry.command';
import { SyncJournalEntryCommandHandler } from './sync-journal-entry.command-handler';

describe('SyncJournalEntryCommandHandler', () => {
  let handler: SyncJournalEntryCommandHandler;
  const quickbooksApiMock = createMock<QuickbooksApi>();
  const repository = createMock<QuickbooksJournalEntryRepository>();
  const apiMapper = createMock<QuickbooksJournalEntryApiMapper>();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncJournalEntryCommandHandler,
        {
          provide: QuickbooksJournalEntryRepository,
          useValue: repository,
        },
        {
          provide: QuickbooksJournalEntryApiMapper,
          useValue: apiMapper,
        },
        {
          provide: QuickbooksApi,
          useValue: quickbooksApiMock,
        },
      ],
    }).compile();

    handler = module.get(SyncJournalEntryCommandHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should load, map, create, and update a journal entry', async () => {
    const journalEntryEntity = EntityStubs.buildStubJournalEntry();
    const command = new SyncJournalEntryCommand(journalEntryEntity.id);
    const apiJournalEntry = { Line: [] } as JournalEntry;
    const createdApiEntry = { Id: 'qb-123' } as JournalEntry;

    repository.getOneById.mockResolvedValue(journalEntryEntity);
    apiMapper.entityToApiJournalEntry.mockResolvedValue(apiJournalEntry);
    quickbooksApiMock.createJournalEntry.mockResolvedValue(createdApiEntry);

    await handler.execute(command);

    expect(repository.getOneById).toHaveBeenCalledWith(
      journalEntryEntity.id,
      expect.any(Object),
    );
    expect(apiMapper.entityToApiJournalEntry).toHaveBeenCalledWith(
      journalEntryEntity,
    );
    expect(quickbooksApiMock.createJournalEntry).toHaveBeenCalledWith(
      apiJournalEntry,
    );

    expect(journalEntryEntity.status).toBe(QuickbooksJournalEntryStatus.Synced);
    expect(journalEntryEntity.quickbooksId).toBe('qb-123');
    expect(journalEntryEntity.syncedAt).toBeInstanceOf(Date);
  });

  it('should throw ValidationError if journal entry is already synced', async () => {
    const syncedJournalEntry = EntityStubs.buildStubJournalEntry({
      id: 'journal-1',
      docName: 'JE-001',
      status: QuickbooksJournalEntryStatus.Synced,
    });
    const command = new SyncJournalEntryCommand(syncedJournalEntry.id);

    repository.getOneById.mockResolvedValue(syncedJournalEntry);

    expect(handler.execute(command)).rejects.toThrow(
      new ValidationError(
        'journal-entry-already-synced',
        'Journal entry JE-001 is already synced to Quickbooks',
      ),
    );

    expect(repository.getOneById).toHaveBeenCalledWith(
      syncedJournalEntry.id,
      expect.any(Object),
    );
    expect(apiMapper.entityToApiJournalEntry).not.toHaveBeenCalled();
    expect(quickbooksApiMock.createJournalEntry).not.toHaveBeenCalled();
  });
});
