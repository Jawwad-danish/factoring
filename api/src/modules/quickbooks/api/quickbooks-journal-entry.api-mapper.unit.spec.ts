import { createMock } from '@golevelup/ts-jest';
import { Collection } from '@mikro-orm/core';
import {
  ClientFactoringConfigsRepository,
  EntityStubs,
} from '@module-persistence';
import {
  QuickbooksJournalPostingType,
  QuickbooksJournalEntryType,
} from '@module-persistence/entities';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import { QuickbooksJournalEntryApiMapper } from './quickbooks-journal-entry.api-mapper';

describe('QuickbooksJournalEntryApiMapper', () => {
  let mapper: QuickbooksJournalEntryApiMapper;
  const clientFactoringConfigsRepository =
    createMock<ClientFactoringConfigsRepository>();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuickbooksJournalEntryApiMapper,
        {
          provide: ClientFactoringConfigsRepository,
          useValue: clientFactoringConfigsRepository,
        },
      ],
    }).compile();

    mapper = module.get(QuickbooksJournalEntryApiMapper);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(mapper).toBeDefined();
  });

  describe('entityToApiJournalEntry', () => {
    it('should map journal entry entity to API format with debit and credit lines', async () => {
      const account1 = EntityStubs.buildStubQuickbooksAccount({
        quickbooksId: 'qb-account-1',
        name: 'Cash Account',
      });
      const account2 = EntityStubs.buildStubQuickbooksAccount({
        quickbooksId: 'qb-account-2',
        name: 'Revenue Account',
      });

      const debitLine = EntityStubs.buildStubJournalEntryLine({
        type: QuickbooksJournalPostingType.Debit,
        amount: new Big(100000),
        account: account1,
      });

      const creditLine = EntityStubs.buildStubJournalEntryLine({
        type: QuickbooksJournalPostingType.Credit,
        amount: new Big(100000),
        account: account2,
      });

      const journalEntry = EntityStubs.buildStubJournalEntry({
        docName: 'JE-001',
        businessDay: '2025-01-15',
        type: QuickbooksJournalEntryType.BatchPayment,
      });

      journalEntry.lines = new Collection(journalEntry, [
        debitLine,
        creditLine,
      ]);

      const result = await mapper.entityToApiJournalEntry(journalEntry);

      expect(result).toEqual({
        DocNumber: 'JE-001',
        TxnDate: '2025-01-15',
        Line: [
          {
            Amount: 1000,
            DetailType: 'JournalEntryLineDetail',
            JournalEntryLineDetail: {
              PostingType: 'Debit',
              AccountRef: {
                value: 'qb-account-1',
                name: 'Cash Account',
              },
            },
          },
          {
            Amount: 1000,
            DetailType: 'JournalEntryLineDetail',
            JournalEntryLineDetail: {
              PostingType: 'Credit',
              AccountRef: {
                value: 'qb-account-2',
                name: 'Revenue Account',
              },
            },
          },
        ],
      });
    });

    it('should add client reference when line has clientId', async () => {
      const account = EntityStubs.buildStubQuickbooksAccount({
        quickbooksId: 'qb-account-1',
        name: 'AR Account',
      });

      const lineWithClient = EntityStubs.buildStubJournalEntryLine({
        type: QuickbooksJournalPostingType.Debit,
        amount: new Big(50000),
        account,
        clientId: 'client-123',
      });

      const journalEntry = EntityStubs.buildStubJournalEntry({
        docName: 'JE-002',
        businessDay: '2025-01-16',
      });

      journalEntry.lines = new Collection(journalEntry, [lineWithClient]);

      const clientConfig = EntityStubs.buildClientFactoringConfig({
        clientId: 'client-123',
        quickbooksId: 'qb-customer-1',
        quickbooksName: 'Test Client LLC',
      });

      clientFactoringConfigsRepository.getOneByClientId.mockResolvedValue(
        clientConfig,
      );

      const result = await mapper.entityToApiJournalEntry(journalEntry);

      expect(
        clientFactoringConfigsRepository.getOneByClientId,
      ).toHaveBeenCalledWith('client-123');
      expect(result.Line[0].JournalEntryLineDetail.Entity).toEqual({
        EntityRef: {
          value: 'qb-customer-1',
          name: 'Test Client LLC',
        },
        Type: 'Customer',
      });
    });

    it('should handle multiple lines with different clients', async () => {
      const account1 = EntityStubs.buildStubQuickbooksAccount({
        quickbooksId: 'qb-account-1',
        name: 'AR Account',
      });
      const account2 = EntityStubs.buildStubQuickbooksAccount({
        quickbooksId: 'qb-account-2',
        name: 'Revenue Account',
      });

      const line1 = EntityStubs.buildStubJournalEntryLine({
        type: QuickbooksJournalPostingType.Debit,
        amount: new Big(75000),
        account: account1,
        clientId: 'client-1',
      });

      const line2 = EntityStubs.buildStubJournalEntryLine({
        type: QuickbooksJournalPostingType.Credit,
        amount: new Big(75000),
        account: account2,
        clientId: 'client-2',
      });

      const journalEntry = EntityStubs.buildStubJournalEntry({
        docName: 'JE-003',
        businessDay: '2025-01-17',
      });

      journalEntry.lines = new Collection(journalEntry, [line1, line2]);

      const client1Config = EntityStubs.buildClientFactoringConfig({
        clientId: 'client-1',
        quickbooksId: 'qb-customer-1',
        quickbooksName: 'Client One LLC',
      });

      const client2Config = EntityStubs.buildClientFactoringConfig({
        clientId: 'client-2',
        quickbooksId: 'qb-customer-2',
        quickbooksName: 'Client Two LLC',
      });

      clientFactoringConfigsRepository.getOneByClientId
        .mockResolvedValueOnce(client1Config)
        .mockResolvedValueOnce(client2Config);

      const result = await mapper.entityToApiJournalEntry(journalEntry);

      expect(
        clientFactoringConfigsRepository.getOneByClientId,
      ).toHaveBeenCalledTimes(2);
      expect(
        clientFactoringConfigsRepository.getOneByClientId,
      ).toHaveBeenCalledWith('client-1');
      expect(
        clientFactoringConfigsRepository.getOneByClientId,
      ).toHaveBeenCalledWith('client-2');

      expect(result.Line[0].JournalEntryLineDetail.Entity).toEqual({
        EntityRef: {
          value: 'qb-customer-1',
          name: 'Client One LLC',
        },
        Type: 'Customer',
      });

      expect(result.Line[1].JournalEntryLineDetail.Entity).toEqual({
        EntityRef: {
          value: 'qb-customer-2',
          name: 'Client Two LLC',
        },
        Type: 'Customer',
      });
    });

    it('should handle lines without clientId', async () => {
      const account = EntityStubs.buildStubQuickbooksAccount({
        quickbooksId: 'qb-account-1',
        name: 'Cash Account',
      });

      const lineWithoutClient = EntityStubs.buildStubJournalEntryLine({
        type: QuickbooksJournalPostingType.Credit,
        amount: new Big(25000),
        account,
        clientId: undefined,
      });

      const journalEntry = EntityStubs.buildStubJournalEntry({
        docName: 'JE-004',
        businessDay: '2025-01-18',
      });

      journalEntry.lines = new Collection(journalEntry, [lineWithoutClient]);

      const result = await mapper.entityToApiJournalEntry(journalEntry);

      expect(
        clientFactoringConfigsRepository.getOneByClientId,
      ).not.toHaveBeenCalled();
      expect(result.Line[0].JournalEntryLineDetail.Entity).toBeUndefined();
    });

    it('should handle empty quickbooksId and name in account', async () => {
      const account = EntityStubs.buildStubQuickbooksAccount({
        quickbooksId: null,
        name: null,
      });

      const line = EntityStubs.buildStubJournalEntryLine({
        type: QuickbooksJournalPostingType.Debit,
        amount: new Big(10000),
        account,
      });

      const journalEntry = EntityStubs.buildStubJournalEntry({
        docName: 'JE-005',
        businessDay: '2025-01-19',
      });

      journalEntry.lines = new Collection(journalEntry, [line]);

      const result = await mapper.entityToApiJournalEntry(journalEntry);

      expect(result.Line[0].JournalEntryLineDetail.AccountRef).toEqual({
        value: '',
        name: '',
      });
    });

    it('should handle empty quickbooksId and name in client config', async () => {
      const account = EntityStubs.buildStubQuickbooksAccount({
        quickbooksId: 'qb-account-1',
        name: 'AR Account',
      });

      const line = EntityStubs.buildStubJournalEntryLine({
        type: QuickbooksJournalPostingType.Debit,
        amount: new Big(30000),
        account,
        clientId: 'client-456',
      });

      const journalEntry = EntityStubs.buildStubJournalEntry({
        docName: 'JE-006',
        businessDay: '2025-01-20',
      });

      journalEntry.lines = new Collection(journalEntry, [line]);

      const clientConfig = EntityStubs.buildClientFactoringConfig({
        clientId: 'client-456',
        quickbooksId: null,
        quickbooksName: null,
      });

      clientFactoringConfigsRepository.getOneByClientId.mockResolvedValue(
        clientConfig,
      );

      const result = await mapper.entityToApiJournalEntry(journalEntry);

      expect(result.Line[0].JournalEntryLineDetail.Entity).toEqual({
        EntityRef: {
          value: '',
          name: '',
        },
        Type: 'Customer',
      });
    });

    it('should convert pennies to dollars correctly', async () => {
      const account = EntityStubs.buildStubQuickbooksAccount({
        quickbooksId: 'qb-account-1',
        name: 'Test Account',
      });

      const line = EntityStubs.buildStubJournalEntryLine({
        type: QuickbooksJournalPostingType.Credit,
        amount: new Big(123456),
        account,
      });

      const journalEntry = EntityStubs.buildStubJournalEntry({
        docName: 'JE-007',
        businessDay: '2025-01-21',
      });

      journalEntry.lines = new Collection(journalEntry, [line]);

      const result = await mapper.entityToApiJournalEntry(journalEntry);

      expect(result.Line[0].Amount).toBe(1234.56);
    });
  });
});
