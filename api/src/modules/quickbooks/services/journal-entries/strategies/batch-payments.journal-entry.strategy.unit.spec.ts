import { mockMikroORMProvider } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import { Collection } from '@mikro-orm/core';
import { ExpediteConfigurer } from '@module-common';
import { EntityStubs, Repositories } from '@module-persistence';
import {
  PaymentType,
  QBAccountKeys,
  QuickbooksAccountEntity,
  QuickbooksJournalEntryType,
  QuickbooksJournalPostingType,
} from '@module-persistence/entities';
import {
  QuickbooksAccountsRepository,
  QuickbooksJournalEntryRepository,
} from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import { BatchPaymentsJournalEntryStrategy } from './batch-payments.journal-entry.strategy';

describe('BatchPaymentsJournalEntryStrategy', () => {
  let strategy: BatchPaymentsJournalEntryStrategy;
  const journalEntriesRepository =
    createMock<QuickbooksJournalEntryRepository>();
  const accountsRepository = createMock<QuickbooksAccountsRepository>();
  accountsRepository.getByKeys.mockImplementation((keys: QBAccountKeys[]) => {
    return Promise.resolve(
      new Map<QBAccountKeys, QuickbooksAccountEntity>(
        keys.map((key) => [
          key,
          EntityStubs.buildStubQuickbooksAccount({ key }),
        ]),
      ),
    );
  });
  const repositories = createMock<Repositories>({
    journalEntries: journalEntriesRepository,
    quickbooksAccounts: accountsRepository,
  });
  const expediteConfigurer = createMock<ExpediteConfigurer>();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchPaymentsJournalEntryStrategy,
        mockMikroORMProvider,
        {
          provide: Repositories,
          useValue: repositories,
        },
        {
          provide: ExpediteConfigurer,
          useValue: expediteConfigurer,
        },
      ],
    }).compile();

    strategy = module.get(BatchPaymentsJournalEntryStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should return BatchPayment entry type', () => {
    expect(strategy.getEntryType()).toBe(
      QuickbooksJournalEntryType.BatchPayment,
    );
  });

  it('should create new journal entry for ACH batch payment', async () => {
    const invoice = EntityStubs.buildStubInvoice({
      approvedFactorFee: new Big(100),
      accountsReceivableValue: new Big(1000),
    });
    const invoicePayment = EntityStubs.buildStubInvoiceClientPayment({
      invoice,
    });
    const clientPayment = EntityStubs.buildStubClientPayment({
      clientId: 'client-1',
    });
    clientPayment.invoicePayments = new Collection(clientPayment, [
      invoicePayment,
    ]);
    const batch = EntityStubs.buildStubClientBatchPayment({
      id: 'batch-1',
      type: PaymentType.ACH,
      createdAt: new Date('2025-01-15T10:30:00Z'),
    });
    batch.clientPayments = new Collection(batch, [clientPayment]);

    journalEntriesRepository.findOne.mockResolvedValue(null);

    const result = await strategy.upsertJournalEntry(batch);

    expect(result.type).toBe(QuickbooksJournalEntryType.BatchPayment);
    expect(result.docName).toBe('CP-ACH-011525-05:30AM');
    expect(result.businessDay).toBe('2025-01-15');
    expect(result.lines.length).toBe(3);

    const lines = result.lines.getItems();
    const revenueLine = lines.find(
      (l) => l.account.key === QBAccountKeys.Revenue,
    );
    const arLine = lines.find(
      (l) => l.account.key === QBAccountKeys.FactoringAR,
    );
    const cashLine = lines.find(
      (l) => l.account.key === QBAccountKeys.OutgoingCash,
    );

    expect(revenueLine).toBeDefined();
    expect(revenueLine?.type).toBe(QuickbooksJournalPostingType.Credit);
    expect(revenueLine?.amount.toNumber()).toBe(100);
    expect(revenueLine?.clientId).toBe('client-1');

    expect(arLine).toBeDefined();
    expect(arLine?.type).toBe(QuickbooksJournalPostingType.Debit);
    expect(arLine?.amount.toNumber()).toBe(1000);
    expect(arLine?.clientId).toBe('client-1');

    expect(cashLine).toBeDefined();
    expect(cashLine?.type).toBe(QuickbooksJournalPostingType.Credit);
    expect(cashLine?.amount.toNumber()).toBe(900);

    expect(journalEntriesRepository.persist).toHaveBeenCalledWith(result);
  });

  it('should add expedite fee line for WIRE batch payment', async () => {
    const invoice = EntityStubs.buildStubInvoice({
      approvedFactorFee: new Big(100),
      accountsReceivableValue: new Big(1000),
    });
    const invoicePayment = EntityStubs.buildStubInvoiceClientPayment({
      invoice,
    });
    const clientPayment = EntityStubs.buildStubClientPayment({
      clientId: 'client-1',
    });
    clientPayment.invoicePayments = new Collection(clientPayment, [
      invoicePayment,
    ]);
    const batch = EntityStubs.buildStubClientBatchPayment({
      id: 'batch-1',
      type: PaymentType.WIRE,
      createdAt: new Date('2025-01-15T10:30:00Z'),
    });
    batch.clientPayments = new Collection(batch, [clientPayment]);

    journalEntriesRepository.findOne.mockResolvedValue(null);
    expediteConfigurer.expediteFee.mockReturnValue(new Big(25));

    const result = await strategy.upsertJournalEntry(batch);

    expect(result.type).toBe(QuickbooksJournalEntryType.BatchPayment);
    expect(result.docName).toBe('CP-WT-011525-05:30AM');
    expect(result.businessDay).toBe('2025-01-15');
    expect(result.lines.length).toBe(4);

    const lines = result.lines.getItems();
    const revenueLine = lines.find(
      (l) => l.account.key === QBAccountKeys.Revenue,
    );
    const arLine = lines.find(
      (l) => l.account.key === QBAccountKeys.FactoringAR,
    );
    const feeRevenueLine = lines.find(
      (l) => l.account.key === QBAccountKeys.FeeRevenue,
    );
    const cashLine = lines.find(
      (l) => l.account.key === QBAccountKeys.OutgoingCash,
    );

    expect(revenueLine).toBeDefined();
    expect(revenueLine?.type).toBe(QuickbooksJournalPostingType.Credit);
    expect(revenueLine?.amount.toNumber()).toBe(100);
    expect(revenueLine?.clientId).toBe('client-1');

    expect(arLine).toBeDefined();
    expect(arLine?.type).toBe(QuickbooksJournalPostingType.Debit);
    expect(arLine?.amount.toNumber()).toBe(1000);
    expect(arLine?.clientId).toBe('client-1');

    expect(feeRevenueLine).toBeDefined();
    expect(feeRevenueLine?.type).toBe(QuickbooksJournalPostingType.Credit);
    expect(feeRevenueLine?.amount.toNumber()).toBe(25);

    expect(cashLine).toBeDefined();
    expect(cashLine?.type).toBe(QuickbooksJournalPostingType.Credit);
    expect(cashLine?.amount.toNumber()).toBe(875);

    expect(journalEntriesRepository.persist).toHaveBeenCalledWith(result);
  });

  it('should reuse existing journal entry if found', async () => {
    const invoice = EntityStubs.buildStubInvoice({
      approvedFactorFee: new Big(100),
      accountsReceivableValue: new Big(1000),
    });
    const invoicePayment = EntityStubs.buildStubInvoiceClientPayment({
      invoice,
    });
    const clientPayment = EntityStubs.buildStubClientPayment({
      clientId: 'client-1',
    });
    clientPayment.invoicePayments = new Collection(clientPayment, [
      invoicePayment,
    ]);
    const batch = EntityStubs.buildStubClientBatchPayment({
      id: 'batch-1',
      type: PaymentType.ACH,
      createdAt: new Date('2025-01-15T10:30:00Z'),
    });
    batch.clientPayments = new Collection(batch, [clientPayment]);

    const existingJournalEntry = EntityStubs.buildStubJournalEntry({
      id: 'journal-1',
      type: QuickbooksJournalEntryType.BatchPayment,
      docName: 'CP-ACH-011525-05:30AM',
    });

    journalEntriesRepository.findOne.mockResolvedValue(existingJournalEntry);
    const result = await strategy.upsertJournalEntry(batch);

    expect(result.id).toBe('journal-1');
    expect(journalEntriesRepository.findOne).toHaveBeenCalledWith({
      businessDay: '2025-01-15',
      type: QuickbooksJournalEntryType.BatchPayment,
      docName: 'CP-ACH-011525-05:30AM',
    });
    expect(journalEntriesRepository.persist).toHaveBeenCalledWith(result);
  });
});
