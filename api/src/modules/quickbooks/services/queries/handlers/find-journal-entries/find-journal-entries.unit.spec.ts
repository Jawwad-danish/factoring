import { FilterOperator, PageCriteria, QueryCriteria } from '@core/data';
import { mockToken } from '@core/test';
import {
  QuickbooksJournalEntryStatus,
  QuickbooksJournalEntryType,
  RecordStatus,
} from '@module-persistence/entities';
import { QuickbooksJournalEntryRepository } from '@module-persistence/repositories';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import { FindJournalEntriesQuery } from '../../find-journal-entries.query';
import { FindJournalEntriesQueryHandler } from './find-journal-entries.query-handler';

describe('FindJournalEntriesQueryHandler', () => {
  let journalEntryRepository: QuickbooksJournalEntryRepository;
  let handler: FindJournalEntriesQueryHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FindJournalEntriesQueryHandler],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    journalEntryRepository = module.get(QuickbooksJournalEntryRepository);
    handler = module.get(FindJournalEntriesQueryHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should find journal entries by query criteria', async () => {
    const stubEntry = EntityStubs.buildStubJournalEntry();
    const findAllSpy = jest
      .spyOn(journalEntryRepository, 'findAll')
      .mockResolvedValueOnce([[stubEntry], 1]);

    const result = await handler.execute(
      new FindJournalEntriesQuery(
        new QueryCriteria({
          page: new PageCriteria({
            limit: 25,
            page: 1,
          }),
          sort: [],
          filters: [],
        }),
      ),
    );

    expect(findAllSpy).toBeCalledTimes(1);
    expect(result.entities.length).toBe(1);
    expect(result.count).toBe(1);
    expect(result.entities[0].id).toBe(stubEntry.id);
  });

  it('should filter by multiple criteria', async () => {
    const stubEntry = EntityStubs.buildStubJournalEntry({
      type: QuickbooksJournalEntryType.BatchPayment,
      status: QuickbooksJournalEntryStatus.Pending,
      businessDay: '2025-10-08',
    });
    const findAllSpy = jest
      .spyOn(journalEntryRepository, 'findAll')
      .mockResolvedValueOnce([[stubEntry], 1]);

    const result = await handler.execute(
      new FindJournalEntriesQuery(
        new QueryCriteria({
          page: new PageCriteria({
            limit: 25,
            page: 1,
          }),
          sort: [],
          filters: [
            {
              name: 'type',
              value: QuickbooksJournalEntryType.BatchPayment,
              operator: FilterOperator.EQ,
            },
            {
              name: 'status',
              value: QuickbooksJournalEntryStatus.Pending,
              operator: FilterOperator.EQ,
            },
            {
              name: 'businessDay',
              value: '2025-10-08',
              operator: FilterOperator.EQ,
            },
          ],
        }),
      ),
    );

    expect(findAllSpy).toBeCalledTimes(1);
    expect(findAllSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        recordStatus: RecordStatus.Active,
        type: {
          [FilterOperator.EQ]: QuickbooksJournalEntryType.BatchPayment,
        },
        status: {
          [FilterOperator.EQ]: QuickbooksJournalEntryStatus.Pending,
        },
        businessDay: {
          [FilterOperator.EQ]: '2025-10-08',
        },
      }),
      expect.any(Object),
    );
    expect(result.entities.length).toBe(1);
  });

  it('should apply default find options', async () => {
    const stubEntry = EntityStubs.buildStubJournalEntry();
    const findAllSpy = jest
      .spyOn(journalEntryRepository, 'findAll')
      .mockResolvedValueOnce([[stubEntry], 1]);

    await handler.execute(
      new FindJournalEntriesQuery(
        new QueryCriteria({
          page: new PageCriteria({
            limit: 25,
            page: 1,
          }),
          sort: [],
          filters: [],
        }),
      ),
    );

    expect(findAllSpy).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        populate: ['lines', 'lines.account'],
        orderBy: { createdAt: 'DESC' },
      }),
    );
  });

  it('should return empty array when no entries found', async () => {
    const findAllSpy = jest
      .spyOn(journalEntryRepository, 'findAll')
      .mockResolvedValueOnce([[], 0]);

    const result = await handler.execute(
      new FindJournalEntriesQuery(
        new QueryCriteria({
          page: new PageCriteria({
            limit: 25,
            page: 1,
          }),
          sort: [],
          filters: [],
        }),
      ),
    );

    expect(findAllSpy).toBeCalledTimes(1);
    expect(result.entities.length).toBe(0);
    expect(result.count).toBe(0);
  });
});
