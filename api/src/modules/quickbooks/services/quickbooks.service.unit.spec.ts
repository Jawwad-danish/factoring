import { FilterOperator, PageCriteria, QueryCriteria } from '@core/data';
import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { mockMikroORMProvider, mockToken } from '../../../core/test';
import { CommandRunner, QueryRunner } from '../../cqrs';
import { QuickbooksApi } from '../api';
import {
  SyncAccountsCommand,
  SyncJournalEntryCommand,
  SyncQuickbooksClientsCommand,
} from './commands';
import {
  FindJournalEntriesQuery,
  FindJournalEntriesQueryResult,
} from './queries';
import { QuickbooksService } from './quickbooks.service';

describe('QuickbooksService', () => {
  let quickbooksService: QuickbooksService;
  const quickbooksApiMock = createMock<QuickbooksApi>();
  let qbApi: QuickbooksApi;
  const queryRunner = createMock<QueryRunner>();
  const commandRunner = createMock<CommandRunner>();
  quickbooksApiMock.getAuthorizationUrl.mockResolvedValue('auth-url');
  quickbooksApiMock.finishAuth.mockResolvedValue('auth-url');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuickbooksService,
        mockMikroORMProvider,
        {
          provide: QuickbooksApi,
          useValue: quickbooksApiMock,
        },
        {
          provide: QueryRunner,
          useValue: queryRunner,
        },
        {
          provide: CommandRunner,
          useValue: commandRunner,
        },
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    quickbooksService = module.get<QuickbooksService>(QuickbooksService);
    qbApi = module.get(QuickbooksApi);
  }, 60000);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(quickbooksService).toBeDefined();
  });

  describe('findJournalEntries', () => {
    it('should call queryRunner with FindJournalEntriesQuery', async () => {
      const criteria: QueryCriteria = new QueryCriteria({
        filters: [],
        page: new PageCriteria({ page: 1, limit: 10 }),
        sort: [],
      });
      const expectedResult: FindJournalEntriesQueryResult = {
        entities: [],
        count: 0,
      };

      queryRunner.run.mockResolvedValue(expectedResult);

      const result = await quickbooksService.findJournalEntries(criteria);

      expect(queryRunner.run).toHaveBeenCalledWith(
        expect.any(FindJournalEntriesQuery),
      );
      expect(queryRunner.run).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it('should pass criteria to FindJournalEntriesQuery', async () => {
      const criteria: QueryCriteria = new QueryCriteria({
        filters: [
          { name: 'status', operator: FilterOperator.EQ, value: 'active' },
        ],
        page: new PageCriteria({ page: 2, limit: 20 }),
        sort: [],
      });
      const expectedResult: FindJournalEntriesQueryResult = {
        entities: [],
        count: 0,
      };

      queryRunner.run.mockResolvedValue(expectedResult);

      await quickbooksService.findJournalEntries(criteria);

      const callArg = queryRunner.run.mock
        .calls[0][0] as FindJournalEntriesQuery;
      expect(callArg.criteria).toEqual(criteria);
    });
  });

  describe('getAuthorizationUrl', () => {
    it('should call quickbooksApi.getAuthorizationUrl with returnUrl', async () => {
      const returnUrl = 'https://example.com/callback';
      const expectedUrl = 'https://quickbooks.com/oauth/authorize';

      jest.spyOn(qbApi, 'getAuthorizationUrl').mockResolvedValue(expectedUrl);

      const result = await quickbooksService.getAuthorizationUrl(returnUrl);

      expect(qbApi.getAuthorizationUrl).toHaveBeenCalledWith(returnUrl);
      expect(qbApi.getAuthorizationUrl).toHaveBeenCalledTimes(1);
      expect(result).toBe(expectedUrl);
    });

    it('should handle different return URLs', async () => {
      const returnUrls = [
        'https://example.com/callback',
        'https://app.example.com/auth/complete',
        '/relative/path',
      ];

      for (const returnUrl of returnUrls) {
        jest.spyOn(qbApi, 'getAuthorizationUrl').mockResolvedValue('auth-url');

        await quickbooksService.getAuthorizationUrl(returnUrl);

        expect(qbApi.getAuthorizationUrl).toHaveBeenCalledWith(returnUrl);
      }
    });
  });

  describe('finishAuth', () => {
    it('should call quickbooksApi.finishAuth with correct parameters', async () => {
      const code = 'auth-code-123';
      const state = 'state-456';
      const realmId = 'realm-789';
      const expectedReturnUrl = 'https://example.com/dashboard';

      jest.spyOn(qbApi, 'finishAuth').mockResolvedValue(expectedReturnUrl);

      const result = await quickbooksService.finishAuth(code, state, realmId);

      expect(qbApi.finishAuth).toHaveBeenCalledWith(code, state, realmId);
      expect(qbApi.finishAuth).toHaveBeenCalledTimes(1);
      expect(result).toBe(expectedReturnUrl);
    });

    it('should handle authentication completion successfully', async () => {
      const code = 'valid-code';
      const state = 'valid-state';
      const realmId = 'valid-realm';

      jest.spyOn(qbApi, 'finishAuth').mockResolvedValue('/success');

      const result = await quickbooksService.finishAuth(code, state, realmId);

      expect(result).toBe('/success');
    });
  });

  describe('syncAccounts', () => {
    it('should call commandRunner with SyncAccountsCommand', async () => {
      jest.spyOn(commandRunner, 'run').mockResolvedValue(undefined);

      await quickbooksService.syncAccounts();

      expect(commandRunner.run).toHaveBeenCalledWith(
        expect.any(SyncAccountsCommand),
      );
      expect(commandRunner.run).toHaveBeenCalledTimes(1);
    });
  });

  describe('syncClients', () => {
    it('should call commandRunner with SyncQuickbooksClientsCommand', async () => {
      jest.spyOn(commandRunner, 'run').mockResolvedValue(undefined);

      await quickbooksService.syncClients();

      expect(commandRunner.run).toHaveBeenCalledWith(
        expect.any(SyncQuickbooksClientsCommand),
      );
      expect(commandRunner.run).toHaveBeenCalledTimes(1);
    });
  });

  describe('syncJournalEntry', () => {
    it('should call syncAccounts before syncing journal entry', async () => {
      const journalEntryId = 'journal-entry-123';
      jest.spyOn(commandRunner, 'run').mockResolvedValue(undefined);

      const syncAccountsSpy = jest.spyOn(quickbooksService, 'syncAccounts');

      await quickbooksService.syncJournalEntry(journalEntryId);

      expect(syncAccountsSpy).toHaveBeenCalledTimes(1);
      expect(commandRunner.run).toHaveBeenCalledWith(
        expect.any(SyncJournalEntryCommand),
      );
    });

    it('should call commandRunner with SyncJournalEntryCommand with correct journalEntryId', async () => {
      const journalEntryId = 'journal-entry-456';
      jest.spyOn(commandRunner, 'run').mockResolvedValue(undefined);

      await quickbooksService.syncJournalEntry(journalEntryId);

      const callArg = commandRunner.run.mock
        .calls[1][0] as SyncJournalEntryCommand;
      expect(callArg.journalEntryId).toBe(journalEntryId);
    });

    it('should handle multiple journal entry IDs', async () => {
      const journalEntryIds = ['entry-1', 'entry-2', 'entry-3'];
      jest.spyOn(commandRunner, 'run').mockResolvedValue(undefined);

      for (const journalEntryId of journalEntryIds) {
        await quickbooksService.syncJournalEntry(journalEntryId);

        const lastCall = commandRunner.run.mock.calls[
          commandRunner.run.mock.calls.length - 1
        ][0] as SyncJournalEntryCommand;
        expect(lastCall.journalEntryId).toBe(journalEntryId);
      }
    });

    it('should call commandRunner twice (once for syncAccounts, once for syncJournalEntry)', async () => {
      const journalEntryId = 'journal-entry-abc';
      jest.spyOn(commandRunner, 'run').mockResolvedValue(undefined);

      await quickbooksService.syncJournalEntry(journalEntryId);

      expect(commandRunner.run).toHaveBeenCalledTimes(2);
      expect(commandRunner.run).toHaveBeenNthCalledWith(
        1,
        expect.any(SyncAccountsCommand),
      );
      expect(commandRunner.run).toHaveBeenNthCalledWith(
        2,
        expect.any(SyncJournalEntryCommand),
      );
    });
  });
});
