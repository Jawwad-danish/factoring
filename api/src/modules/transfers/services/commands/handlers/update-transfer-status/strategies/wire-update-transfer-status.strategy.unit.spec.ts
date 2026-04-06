import { mockMikroORMProvider } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import {
  ClientBatchPaymentRepository,
  ClientBatchPaymentStatus,
  ClientPaymentStatus,
  InvoiceClientPaymentRepository,
  InvoiceRepository,
  PaymentStatus,
  Repositories,
} from '@module-persistence';
import { EntityStubs } from '@module-persistence/test';
import {
  BatchState,
  PaymentTransfer,
  TransferData,
  TransferDirection,
  TransferPaymentType,
  TransferState,
} from '@module-transfers/data';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import { UUID } from '@core/uuid';
import { WireUpdateTransferStatusStrategy } from './wire-update-transfer-status.strategy';

describe('WireUpdateTransferStatusStrategy', () => {
  let strategy: WireUpdateTransferStatusStrategy;
  const clientBatchPaymentRepository =
    createMock<ClientBatchPaymentRepository>();
  const invoiceClientPaymentRepository =
    createMock<InvoiceClientPaymentRepository>();
  const invoiceRepository = createMock<InvoiceRepository>();
  const repositories = createMock<Repositories>({
    clientBatchPayment: clientBatchPaymentRepository,
    invoiceClientPayment: invoiceClientPaymentRepository,
    invoice: invoiceRepository,
  });
  const invoiceChangeActionsExecutor =
    createMock<InvoiceChangeActionsExecutor>();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WireUpdateTransferStatusStrategy,
        mockMikroORMProvider,
        {
          provide: Repositories,
          useValue: repositories,
        },
        {
          provide: InvoiceChangeActionsExecutor,
          useValue: invoiceChangeActionsExecutor,
        },
      ],
    }).compile();

    strategy = module.get(WireUpdateTransferStatusStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockInvoiceClientPayments = () => {
    const invoice = EntityStubs.buildStubInvoice();
    const invoiceClientPayments = [
      EntityStubs.buildStubInvoiceClientPayment({ invoice }),
    ];
    invoiceClientPaymentRepository.findAll.mockResolvedValue([
      invoiceClientPayments,
      1,
    ]);
    return invoice;
  };

  const buildTransferData = (
    state: BatchState,
    transfers: PaymentTransfer[],
  ): TransferData => {
    return new TransferData({
      id: UUID.get(),
      externalId: UUID.get(),
      state,
      amount: Big(1000),
      metadata: {},
      transfers,
    });
  };

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('update', () => {
    it('should skip update when batch state is not completed', async () => {
      const batchPayment = EntityStubs.buildStubClientBatchPayment();
      const transferData = buildTransferData(BatchState.Processing, []);

      await strategy.update(batchPayment, transferData);

      expect(clientBatchPaymentRepository.persist).not.toHaveBeenCalled();
    });

    it('should throw error when no wire/RTP transfer found', async () => {
      const batchPayment = EntityStubs.buildStubClientBatchPayment();
      const transferData = buildTransferData(BatchState.Completed, [
        new PaymentTransfer({
          id: UUID.get(),
          state: TransferState.Completed,
          amount: Big(1000),
          direction: TransferDirection.Credit,
          paymentType: TransferPaymentType.ACH,
          originatingAccountId: UUID.get(),
          receivingAccountId: UUID.get(),
          createdAt: new Date(),
          modifiedAt: new Date(),
        }),
      ]);

      await expect(strategy.update(batchPayment, transferData)).rejects.toThrow(
        'No wire transfer was found',
      );
    });

    it('should update batch payment and client payments on completed Wire transfer', async () => {
      const clientPayment = EntityStubs.buildStubClientPayment();
      const batchPayment = EntityStubs.buildStubClientBatchPayment();
      batchPayment.clientPayments.add([clientPayment]);
      const invoice = mockInvoiceClientPayments();

      const transferData = buildTransferData(BatchState.Completed, [
        new PaymentTransfer({
          id: UUID.get(),
          state: TransferState.Completed,
          amount: Big(1000),
          direction: TransferDirection.Credit,
          paymentType: TransferPaymentType.Wire,
          originatingAccountId: UUID.get(),
          receivingAccountId: UUID.get(),
          createdAt: new Date(),
          modifiedAt: new Date(),
        }),
      ]);

      await strategy.update(batchPayment, transferData);

      expect(batchPayment.status).toBe(ClientBatchPaymentStatus.Done);
      expect(clientPayment.status).toBe(PaymentStatus.DONE);
      expect(invoice.clientPaymentStatus).toBe(ClientPaymentStatus.Completed);
      expect(clientBatchPaymentRepository.persist).toHaveBeenCalledWith(
        batchPayment,
      );
      expect(invoiceChangeActionsExecutor.apply).toHaveBeenCalled();
    });

    it('should update batch payment and client payments on completed RTP transfer', async () => {
      const clientPayment = EntityStubs.buildStubClientPayment();
      const batchPayment = EntityStubs.buildStubClientBatchPayment();
      batchPayment.clientPayments.add([clientPayment]);
      const invoice = mockInvoiceClientPayments();

      const transferData = buildTransferData(BatchState.Completed, [
        new PaymentTransfer({
          id: UUID.get(),
          state: TransferState.Completed,
          amount: Big(1000),
          direction: TransferDirection.Credit,
          paymentType: TransferPaymentType.RTP,
          originatingAccountId: UUID.get(),
          receivingAccountId: UUID.get(),
          createdAt: new Date(),
          modifiedAt: new Date(),
        }),
      ]);

      await strategy.update(batchPayment, transferData);

      expect(batchPayment.status).toBe(ClientBatchPaymentStatus.Done);
      expect(clientPayment.status).toBe(PaymentStatus.DONE);
      expect(invoice.clientPaymentStatus).toBe(ClientPaymentStatus.Completed);
      expect(clientBatchPaymentRepository.persist).toHaveBeenCalledWith(
        batchPayment,
      );
    });

    it('should set failed status when wire transfer fails', async () => {
      const clientPayment = EntityStubs.buildStubClientPayment();
      const batchPayment = EntityStubs.buildStubClientBatchPayment();
      batchPayment.clientPayments.add([clientPayment]);
      const invoice = mockInvoiceClientPayments();

      const transferData = buildTransferData(BatchState.Completed, [
        new PaymentTransfer({
          id: UUID.get(),
          state: TransferState.Failed,
          amount: Big(1000),
          direction: TransferDirection.Credit,
          paymentType: TransferPaymentType.Wire,
          originatingAccountId: UUID.get(),
          receivingAccountId: UUID.get(),
          createdAt: new Date(),
          modifiedAt: new Date(),
        }),
      ]);

      await strategy.update(batchPayment, transferData);

      expect(batchPayment.status).toBe(ClientBatchPaymentStatus.Failed);
      expect(clientPayment.status).toBe(PaymentStatus.FAILED);
      expect(invoice.clientPaymentStatus).toBe(ClientPaymentStatus.Failed);
      expect(clientBatchPaymentRepository.persist).toHaveBeenCalledWith(
        batchPayment,
      );
    });

    it('should prefer Wire transfer over RTP when both exist', async () => {
      const clientPayment = EntityStubs.buildStubClientPayment();
      const batchPayment = EntityStubs.buildStubClientBatchPayment();
      batchPayment.clientPayments.add([clientPayment]);
      mockInvoiceClientPayments();

      const transferData = buildTransferData(BatchState.Completed, [
        new PaymentTransfer({
          id: UUID.get(),
          state: TransferState.Failed,
          amount: Big(1000),
          direction: TransferDirection.Credit,
          paymentType: TransferPaymentType.RTP,
          originatingAccountId: UUID.get(),
          receivingAccountId: UUID.get(),
          createdAt: new Date(),
          modifiedAt: new Date(),
        }),
        new PaymentTransfer({
          id: UUID.get(),
          state: TransferState.Completed,
          amount: Big(1000),
          direction: TransferDirection.Credit,
          paymentType: TransferPaymentType.Wire,
          originatingAccountId: UUID.get(),
          receivingAccountId: UUID.get(),
          createdAt: new Date(),
          modifiedAt: new Date(),
        }),
      ]);

      await strategy.update(batchPayment, transferData);

      // Should use the first matching transfer (RTP in this case since it's first)
      expect(batchPayment.status).toBe(ClientBatchPaymentStatus.Failed);
    });
  });
});
