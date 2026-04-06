import { mockMikroORMProvider, mockToken } from '@core/test';
import { UUID } from '@core/uuid';
import { createMock } from '@golevelup/ts-jest';
import {
  ClientBatchPaymentEntity,
  ClientBatchPaymentRepository,
  ClientBatchPaymentStatus,
  ClientPaymentEntity,
  PaymentType,
  Repositories,
} from '@module-persistence';
import { EntityStubs } from '@module-persistence/test';
import {
  PaymentTransfer,
  TransferDirection,
  TransferPaymentType,
  TransferState,
} from '@module-transfers/data';
import { buildStubUpdateTransferStatusWebhookRequest } from '@module-transfers/test';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import { UpdateTransferStatusCommand } from '../../update-transfer-status.command';
import { UpdateTransferStatusStrategyFactory } from './strategies';
import { BaseUpdateTransferStatusStrategy } from './strategies/base-update-transfer-status.strategy';
import { UpdateTransferStatusCommandHandler } from './update-transfer-status.command-handler';

describe('Update transfer status command handler', () => {
  const clientBatchPaymentRepository =
    createMock<ClientBatchPaymentRepository>();
  const repositories = createMock<Repositories>({
    clientBatchPayment: clientBatchPaymentRepository,
  });
  const mockStrategy = createMock<BaseUpdateTransferStatusStrategy>();
  const strategyFactory = createMock<UpdateTransferStatusStrategyFactory>();

  let handler: UpdateTransferStatusCommandHandler;

  beforeEach(async () => {
    strategyFactory.getStrategy.mockReturnValue(mockStrategy);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateTransferStatusCommandHandler,
        Repositories,
        UpdateTransferStatusStrategyFactory,
        mockMikroORMProvider,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .overrideProvider(UpdateTransferStatusStrategyFactory)
      .useValue(strategyFactory)
      .overrideProvider(Repositories)
      .useValue(repositories)
      .compile();

    handler = module.get(UpdateTransferStatusCommandHandler);
  });

  const mockBatchPayment = (
    data?: Partial<ClientBatchPaymentEntity>,
    clientPayments?: ClientPaymentEntity[],
  ) => {
    const batchPayment = EntityStubs.buildStubClientBatchPayment(data);
    batchPayment.clientPayments.add(
      clientPayments || [EntityStubs.buildStubClientPayment()],
    );
    clientBatchPaymentRepository.findOneById.mockResolvedValueOnce(
      batchPayment,
    );
    return batchPayment;
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should load batch payment and delegate to strategy', async () => {
      const batchPayment = mockBatchPayment({ type: PaymentType.WIRE });

      const transfers = [
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
      ];
      const payload = buildStubUpdateTransferStatusWebhookRequest(
        TransferPaymentType.Wire,
      );
      payload.data.transfers = transfers;

      await handler.execute(new UpdateTransferStatusCommand(payload));

      expect(strategyFactory.getStrategy).toHaveBeenCalledWith(
        PaymentType.WIRE,
      );
      expect(mockStrategy.update).toHaveBeenCalledWith(
        batchPayment,
        payload.data,
      );
    });

    it('should use ACH strategy for ACH batch payment', async () => {
      mockBatchPayment({ type: PaymentType.ACH });

      const payload = buildStubUpdateTransferStatusWebhookRequest(
        TransferPaymentType.ACH,
      );
      payload.data.transfers = [];

      await handler.execute(new UpdateTransferStatusCommand(payload));

      expect(strategyFactory.getStrategy).toHaveBeenCalledWith(PaymentType.ACH);
    });

    it('should use DEBIT strategy for DEBIT batch payment', async () => {
      mockBatchPayment({ type: PaymentType.DEBIT });

      const payload = buildStubUpdateTransferStatusWebhookRequest(
        TransferPaymentType.ACH,
      );
      payload.data.transfers = [];

      await handler.execute(new UpdateTransferStatusCommand(payload));

      expect(strategyFactory.getStrategy).toHaveBeenCalledWith(
        PaymentType.DEBIT,
      );
    });

    it('should skip update if batch payment is in final status', async () => {
      mockBatchPayment({ status: ClientBatchPaymentStatus.Done });

      const payload = buildStubUpdateTransferStatusWebhookRequest(
        TransferPaymentType.ACH,
      );

      await handler.execute(new UpdateTransferStatusCommand(payload));

      expect(mockStrategy.update).not.toHaveBeenCalled();
    });
  });

  describe('loadBatchPayment', () => {
    it('should throw error when batch payment not found', async () => {
      clientBatchPaymentRepository.findOneById.mockResolvedValueOnce(null);
      clientBatchPaymentRepository.find.mockResolvedValueOnce([]);

      const payload = buildStubUpdateTransferStatusWebhookRequest(
        TransferPaymentType.ACH,
      );

      await expect(
        handler.execute(new UpdateTransferStatusCommand(payload)),
      ).rejects.toThrow('Batch payment');
    });

    it('should skip findScheduledAch when v1TransferTime does not start with scheduled', async () => {
      clientBatchPaymentRepository.findOneById.mockResolvedValueOnce(null);

      const payload = buildStubUpdateTransferStatusWebhookRequest(
        TransferPaymentType.ACH,
      );
      payload.data.metadata = {
        v1TransferTime: 'immediate',
        fromV1: true,
        v1CreatedAt: new Date().toISOString(),
      };

      await expect(
        handler.execute(new UpdateTransferStatusCommand(payload)),
      ).rejects.toThrow('Batch payment');

      expect(clientBatchPaymentRepository.find).not.toHaveBeenCalled();
    });

    it('should skip findScheduledAch when fromV1 is missing', async () => {
      clientBatchPaymentRepository.findOneById.mockResolvedValueOnce(null);

      const payload = buildStubUpdateTransferStatusWebhookRequest(
        TransferPaymentType.ACH,
      );
      payload.data.metadata = {
        v1TransferTime: 'scheduled-10pm',
        v1CreatedAt: new Date().toISOString(),
      };

      await expect(
        handler.execute(new UpdateTransferStatusCommand(payload)),
      ).rejects.toThrow('Batch payment');

      expect(clientBatchPaymentRepository.find).not.toHaveBeenCalled();
    });

    it('should skip findScheduledAch when v1CreatedAt is missing', async () => {
      clientBatchPaymentRepository.findOneById.mockResolvedValueOnce(null);

      const payload = buildStubUpdateTransferStatusWebhookRequest(
        TransferPaymentType.ACH,
      );
      payload.data.metadata = {
        v1TransferTime: 'scheduled-10pm',
        fromV1: true,
      };

      await expect(
        handler.execute(new UpdateTransferStatusCommand(payload)),
      ).rejects.toThrow('Batch payment');

      expect(clientBatchPaymentRepository.find).not.toHaveBeenCalled();
    });

    it('should find scheduled ACH payment by createdAt with 1 minute tolerance', async () => {
      clientBatchPaymentRepository.findOneById.mockResolvedValueOnce(null);
      clientBatchPaymentRepository.findOne.mockResolvedValueOnce(
        EntityStubs.buildStubClientBatchPayment({
          type: PaymentType.ACH,
        }),
      );

      const batchPayment = EntityStubs.buildStubClientBatchPayment({
        type: PaymentType.ACH,
      });
      batchPayment.clientPayments.add([EntityStubs.buildStubClientPayment()]);

      const v1CreatedAt = new Date('2025-01-15T10:30:00Z');
      const payload = buildStubUpdateTransferStatusWebhookRequest(
        TransferPaymentType.ACH,
      );
      payload.data.metadata = {
        v1TransferTime: 'scheduled-10pm-26/11/2025',
        fromV1: true,
        v1CreatedAt: v1CreatedAt.toISOString(),
      };

      await handler.execute(new UpdateTransferStatusCommand(payload));

      expect(clientBatchPaymentRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: {
            $gte: expect.any(Date),
            $lte: expect.any(Date),
          },
          type: PaymentType.ACH,
          createdBy: expect.any(String),
        }),
        expect.objectContaining({
          populate: ['clientPayments'],
        }),
      );

      expect(mockStrategy.update).toHaveBeenCalled();
    });

    it('should return null when no scheduled ACH payment found', async () => {
      clientBatchPaymentRepository.findOneById.mockResolvedValueOnce(null);
      clientBatchPaymentRepository.findOne.mockResolvedValueOnce(null);

      const payload = buildStubUpdateTransferStatusWebhookRequest(
        TransferPaymentType.ACH,
      );
      payload.data.metadata = {
        v1TransferTime: 'scheduled-10pm-26/11/2025',
        fromV1: true,
        v1CreatedAt: new Date().toISOString(),
      };

      await expect(
        handler.execute(new UpdateTransferStatusCommand(payload)),
      ).rejects.toThrow('Batch payment');
    });

    it('should override batch payment id with externalId for v1 scheduled payments', async () => {
      clientBatchPaymentRepository.findOneById.mockResolvedValueOnce(null);
      clientBatchPaymentRepository.findOne.mockResolvedValueOnce(
        EntityStubs.buildStubClientBatchPayment({
          type: PaymentType.ACH,
        }),
      );

      const originalId = UUID.get();
      const externalId = UUID.get();
      const batchPayment = EntityStubs.buildStubClientBatchPayment({
        id: originalId,
        type: PaymentType.ACH,
      });
      batchPayment.clientPayments.add([EntityStubs.buildStubClientPayment()]);

      const payload = buildStubUpdateTransferStatusWebhookRequest(
        TransferPaymentType.ACH,
      );
      payload.data.externalId = externalId;
      payload.data.metadata = {
        v1TransferTime: 'scheduled-10pm-26/11/2025',
        fromV1: true,
        v1CreatedAt: new Date().toISOString(),
      };
      payload.data.transfers = [];

      await handler.execute(new UpdateTransferStatusCommand(payload));

      // The batch payment id should be overridden
      expect(mockStrategy.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: externalId,
        }),
        payload.data,
      );
    });
  });
});
