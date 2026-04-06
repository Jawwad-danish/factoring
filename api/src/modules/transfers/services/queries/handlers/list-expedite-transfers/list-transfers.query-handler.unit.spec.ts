import { Test } from '@nestjs/testing';
import { ListTransfersQueryHandler } from './list-transfers.query-handler';
import { ListTransfersQuery } from '../../list-transfers.query';
import { QueryCriteria, FilterCriteria, FilterOperator } from '@core/data';
import {
  BatchTransferResponseV1,
  TransferResponseV1PaymentType,
  TransferResponseV1State,
  TransfersApi,
} from '../../../../api';
import {
  ClientPaymentRepository,
  PaymentOrderRepository,
} from '@module-persistence/repositories';
import { Client, ClientService } from '@module-clients';
import { ClientPaymentEntity, PaymentOrderEntity } from '@module-persistence';

describe('ListTransfersQueryHandler', () => {
  let handler: ListTransfersQueryHandler;
  let transferApi: jest.Mocked<TransfersApi>;
  let clientPaymentRepository: jest.Mocked<ClientPaymentRepository>;
  let paymentOrderRepository: jest.Mocked<PaymentOrderRepository>;
  let clientService: jest.Mocked<ClientService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ListTransfersQueryHandler,
        {
          provide: TransfersApi,
          useValue: {
            listTransfers: jest.fn(),
          },
        },
        {
          provide: ClientPaymentRepository,
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: PaymentOrderRepository,
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: ClientService,
          useValue: {
            findByIds: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<ListTransfersQueryHandler>(ListTransfersQueryHandler);
    transferApi = module.get(TransfersApi);
    clientPaymentRepository = module.get(ClientPaymentRepository);
    paymentOrderRepository = module.get(PaymentOrderRepository);
    clientService = module.get(ClientService);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return empty results when no transfers are found', async () => {
      const criteria = new QueryCriteria();
      transferApi.listTransfers.mockResolvedValue({
        items: [],
        nextCursor: undefined,
      });

      const result = await handler.execute(new ListTransfersQuery(criteria));

      expect(result).toEqual({
        items: [],
        nextCursor: '',
      });
      expect(transferApi.listTransfers).toHaveBeenCalledWith(criteria);
      expect(clientPaymentRepository.find).not.toHaveBeenCalled();
      expect(paymentOrderRepository.find).not.toHaveBeenCalled();
      expect(clientService.findByIds).not.toHaveBeenCalled();
    });

    it('should fetch next page when no transfers are found but cursor exists', async () => {
      const criteria = new QueryCriteria();
      const nextCursor = 'next-page-cursor';

      transferApi.listTransfers.mockResolvedValueOnce({
        items: [],
        nextCursor,
      });

      transferApi.listTransfers.mockResolvedValueOnce({
        items: [],
        nextCursor: undefined,
      });

      await handler.execute(new ListTransfersQuery(criteria));

      expect(transferApi.listTransfers).toHaveBeenCalledTimes(2);
      expect(transferApi.listTransfers).toHaveBeenNthCalledWith(1, criteria);

      const expectedNextPageCriteria = new QueryCriteria({
        ...criteria,
        filters: [
          new FilterCriteria({
            name: 'cursor',
            operator: FilterOperator.EQ,
            value: nextCursor,
          }),
        ],
      });
      expect(transferApi.listTransfers).toHaveBeenNthCalledWith(
        2,
        expectedNextPageCriteria,
      );
    });

    it('should process transfers and map them to response', async () => {
      const criteria = new QueryCriteria();
      const batchTransferId = 'batch-transfer-id';
      const clientId = 'client-id';
      const bankAccountId = 'bank-account-id';
      const transferId = 'transfer-id';

      const mockBatchTransfer = {
        id: batchTransferId,
        transfers: [
          {
            id: transferId,
            amount: 100,
            paymentType: TransferResponseV1PaymentType.Ach,
            state: TransferResponseV1State.Completed,
            createdAt: '2025-12-01T12:00:00Z',
          },
        ],
      } as BatchTransferResponseV1;

      transferApi.listTransfers.mockResolvedValue({
        items: [mockBatchTransfer],
        nextCursor: undefined,
      });

      clientPaymentRepository.find.mockResolvedValue([
        {
          id: 'payment-id',
          clientId,
          clientBankAccountId: bankAccountId,
          bankAccountLastDigits: '1234',
          batchPayment: { id: batchTransferId },
        } as ClientPaymentEntity,
      ]);
      paymentOrderRepository.find.mockResolvedValue([]);

      clientService.findByIds.mockResolvedValue([
        {
          id: clientId,
          name: 'Test Client',
          bankAccounts: [
            {
              id: bankAccountId,
              name: 'Test Bank Account',
              plaidAccount: {
                bankName: 'Bank Of America',
              },
            },
          ],
        } as Client,
      ]);

      const result = await handler.execute(new ListTransfersQuery(criteria));

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual({
        id: 'payment-id',
        transfersId: transferId,
        counterpartyName: 'Test Client',
        amount: 100,
        transferType: TransferResponseV1PaymentType.Ach,
        failureReason: '',
        status: TransferResponseV1State.Completed,
        paymentDate: new Date('2025-12-01T12:00:00Z'),
        receivingAccount: 'Test Bank Account',
        bankAccountId,
        lastFourDigits: '1234',
        counterpartyBankName: 'Bank Of America',
      });
    });

    it('should handle case when client payment is not found', async () => {
      const criteria = new QueryCriteria();
      const batchTransferId = 'batch-transfer-id';

      transferApi.listTransfers.mockResolvedValue({
        items: [
          {
            id: batchTransferId,
            transfers: [
              {
                id: 'transfer-id',
                amount: 100,
                paymentType: TransferResponseV1PaymentType.Rtp,
                state: TransferResponseV1State.Pending,
                createdAt: '2025-12-01T12:00:00Z',
              },
            ],
          } as BatchTransferResponseV1,
        ],
        nextCursor: undefined,
      });

      clientPaymentRepository.find.mockResolvedValue([]);
      paymentOrderRepository.find.mockResolvedValue([]);

      const result = await handler.execute(new ListTransfersQuery(criteria));

      expect(result.items).toHaveLength(1);
      expect(clientPaymentRepository.find).toHaveBeenCalled();
      expect(paymentOrderRepository.find).toHaveBeenCalled();
      expect(clientService.findByIds).not.toHaveBeenCalled();
      expect(result.items[0]).toEqual({
        id: batchTransferId,
        transfersId: 'transfer-id',
        counterpartyName: 'N/A',
        amount: 100,
        transferType: TransferResponseV1PaymentType.Rtp,
        failureReason: '',
        status: TransferResponseV1State.Pending,
        paymentDate: new Date('2025-12-01T12:00:00Z'),
        receivingAccount: 'N/A',
        bankAccountId: 'N/A',
        lastFourDigits: 'N/A',
        counterpartyBankName: undefined,
      });
    });

    it('should handle case when client is not found', async () => {
      const criteria = new QueryCriteria();
      const batchTransferId = 'batch-transfer-id';
      const clientId = 'client-id';

      transferApi.listTransfers.mockResolvedValue({
        items: [
          {
            id: batchTransferId,
            transfers: [
              {
                id: 'transfer-id',
                amount: 100,
                paymentType: TransferResponseV1PaymentType.Rtp,
                state: TransferResponseV1State.Pending,
                createdAt: '2025-12-01T12:00:00Z',
              },
            ],
          } as BatchTransferResponseV1,
        ],
        nextCursor: undefined,
      });

      clientPaymentRepository.find.mockResolvedValue([
        {
          id: 'payment-id',
          clientId,
          batchPayment: { id: batchTransferId },
        } as ClientPaymentEntity,
      ]);
      paymentOrderRepository.find.mockResolvedValue([]);

      clientService.findByIds.mockResolvedValue([]);

      const result = await handler.execute(new ListTransfersQuery(criteria));

      expect(result.items).toHaveLength(1);
      expect(clientService.findByIds).toHaveBeenCalledWith([clientId], {
        includeBankAccounts: true,
      });
      expect(clientPaymentRepository.find).toHaveBeenCalled();
      expect(result.items[0]).toEqual({
        id: 'payment-id',
        transfersId: 'transfer-id',
        counterpartyName: 'N/A',
        amount: 100,
        transferType: TransferResponseV1PaymentType.Rtp,
        failureReason: '',
        status: TransferResponseV1State.Pending,
        paymentDate: new Date('2025-12-01T12:00:00Z'),
        receivingAccount: 'N/A',
        bankAccountId: 'N/A',
        lastFourDigits: 'N/A',
        counterpartyBankName: undefined,
      });
    });

    it('should handle case when bank account is not found', async () => {
      const criteria = new QueryCriteria();
      const batchTransferId = 'batch-transfer-id';
      const clientId = 'client-id';
      const nonExistentBankAccountId = 'non-existent-bank-account';

      transferApi.listTransfers.mockResolvedValue({
        items: [
          {
            id: batchTransferId,
            transfers: [
              {
                id: 'transfer-id',
                amount: 100,
                paymentType: TransferResponseV1PaymentType.Rtp,
                state: TransferResponseV1State.Pending,
                createdAt: '2025-12-01T12:00:00Z',
              },
            ],
          } as BatchTransferResponseV1,
        ],
        nextCursor: undefined,
      });

      clientPaymentRepository.find.mockResolvedValue([
        {
          id: 'payment-id',
          clientId,
          clientBankAccountId: nonExistentBankAccountId,
          batchPayment: { id: batchTransferId },
        } as ClientPaymentEntity,
      ]);
      paymentOrderRepository.find.mockResolvedValue([]);

      clientService.findByIds.mockResolvedValue([
        {
          id: clientId,
          name: 'Test Client',
          bankAccounts: [
            {
              id: 'different-bank-account-id',
              name: 'Different Bank Account',
              plaidAccount: {
                bankAccountOwnerName: 'test1 2',
              },
            },
          ],
        } as Client,
      ]);

      const result = await handler.execute(new ListTransfersQuery(criteria));

      expect(result.items).toHaveLength(1);
      expect(clientPaymentRepository.find).toHaveBeenCalled();
      expect(clientService.findByIds).toHaveBeenCalled();
      expect(result.items[0]).toEqual({
        id: 'payment-id',
        transfersId: 'transfer-id',
        counterpartyName: 'Test Client',
        amount: 100,
        transferType: TransferResponseV1PaymentType.Rtp,
        failureReason: '',
        status: TransferResponseV1State.Pending,
        paymentDate: new Date('2025-12-01T12:00:00Z'),
        receivingAccount: 'N/A',
        bankAccountId: 'non-existent-bank-account',
        lastFourDigits: 'N/A',
        counterpartyBankName: undefined,
      });
    });

    it('should handle errors gracefully', async () => {
      const criteria = new QueryCriteria();
      const error = new Error('Test error');

      transferApi.listTransfers.mockRejectedValue(error);

      await expect(
        handler.execute(new ListTransfersQuery(criteria)),
      ).rejects.toThrow(error);
    });

    it('should handle transfers with no client bank account match', async () => {
      const criteria = new QueryCriteria();
      const batchTransferId = 'batch-transfer-id';
      const clientId = 'client-id';
      const bankAccountId = 'bank-account-id';

      transferApi.listTransfers.mockResolvedValue({
        items: [
          {
            id: batchTransferId,
            transfers: [
              {
                id: 'transfer-id',
                amount: 100,
                paymentType: TransferResponseV1PaymentType.Rtp,
                state: TransferResponseV1State.Completed,
                createdAt: '2025-12-01T12:00:00Z',
              },
            ],
          } as BatchTransferResponseV1,
        ],
        nextCursor: undefined,
      });

      clientPaymentRepository.find.mockResolvedValue([
        {
          id: 'payment-id',
          clientId,
          clientBankAccountId: bankAccountId,
          bankAccountLastDigits: '1234',
          batchPayment: { id: batchTransferId },
        } as ClientPaymentEntity,
      ]);
      paymentOrderRepository.find.mockResolvedValue([]);

      clientService.findByIds.mockResolvedValue([
        {
          id: clientId,
          name: 'Test Client',
          bankAccounts: [],
        } as unknown as Client,
      ]);

      const result = await handler.execute(new ListTransfersQuery(criteria));

      expect(result.items).toHaveLength(1);
      expect(clientPaymentRepository.find).toHaveBeenCalled();
      expect(clientService.findByIds).toHaveBeenCalled();
      expect(result.items[0]).toEqual({
        id: 'payment-id',
        transfersId: 'transfer-id',
        counterpartyName: 'Test Client',
        amount: 100,
        transferType: TransferResponseV1PaymentType.Rtp,
        failureReason: '',
        status: TransferResponseV1State.Completed,
        paymentDate: new Date('2025-12-01T12:00:00Z'),
        receivingAccount: 'N/A',
        bankAccountId: 'bank-account-id',
        lastFourDigits: '1234',
        counterpartyBankName: undefined,
      });
    });

    it('should process transfers from payment orders when client payment is not found', async () => {
      const criteria = new QueryCriteria();
      const batchTransferId = 'batch-transfer-id';
      const clientId = 'client-id';
      const bankAccountId = 'bank-account-id';
      const transferId = 'transfer-id';

      transferApi.listTransfers.mockResolvedValue({
        items: [
          {
            id: batchTransferId,
            transfers: [
              {
                id: transferId,
                amount: 100,
                paymentType: TransferResponseV1PaymentType.Rtp,
                state: TransferResponseV1State.Completed,
                createdAt: '2025-12-01T12:00:00Z',
              },
            ],
          } as BatchTransferResponseV1,
        ],
        nextCursor: undefined,
      });

      clientPaymentRepository.find.mockResolvedValue([]);

      paymentOrderRepository.find.mockResolvedValue([
        {
          id: batchTransferId,
          clientId,
          clientBankAccountId: bankAccountId,
          bankAccountLastDigits: '5678',
        } as PaymentOrderEntity,
      ]);

      clientService.findByIds.mockResolvedValue([
        {
          id: clientId,
          name: 'Test Client From PaymentOrder',
          bankAccounts: [
            {
              id: bankAccountId,
              name: 'Test Bank Account From PaymentOrder',
              plaidAccount: {
                bankName: 'Bank Of America',
              },
            },
          ],
        } as Client,
      ]);

      const result = await handler.execute(new ListTransfersQuery(criteria));

      expect(result.items).toHaveLength(1);
      expect(clientPaymentRepository.find).toHaveBeenCalled();
      expect(paymentOrderRepository.find).toHaveBeenCalled();
      expect(clientService.findByIds).toHaveBeenCalled();
      expect(result.items[0]).toEqual({
        id: batchTransferId,
        transfersId: transferId,
        counterpartyName: 'Test Client From PaymentOrder',
        amount: 100,
        transferType: TransferResponseV1PaymentType.Rtp,
        failureReason: '',
        status: TransferResponseV1State.Completed,
        paymentDate: new Date('2025-12-01T12:00:00Z'),
        receivingAccount: 'Test Bank Account From PaymentOrder',
        bankAccountId,
        lastFourDigits: '5678',
        counterpartyBankName: 'Bank Of America',
      });
    });

    it('should prefer client payment over payment order when both exist', async () => {
      const criteria = new QueryCriteria();
      const batchTransferId = 'batch-transfer-id';
      const clientId = 'client-id';
      const bankAccountId = 'bank-account-id';
      const transferId = 'transfer-id';

      transferApi.listTransfers.mockResolvedValue({
        items: [
          {
            id: batchTransferId,
            transfers: [
              {
                id: transferId,
                amount: 100,
                paymentType: TransferResponseV1PaymentType.Ach,
                state: TransferResponseV1State.Completed,
                createdAt: '2025-12-01T12:00:00Z',
              },
            ],
          } as BatchTransferResponseV1,
        ],
        nextCursor: undefined,
      });

      clientPaymentRepository.find.mockResolvedValue([
        {
          id: 'client-payment-id',
          clientId,
          clientBankAccountId: bankAccountId,
          bankAccountLastDigits: '1234',
          batchPayment: { id: batchTransferId },
        } as ClientPaymentEntity,
      ]);

      paymentOrderRepository.find.mockResolvedValue([
        {
          id: batchTransferId,
          clientId: 'different-client-id',
          clientBankAccountId: 'different-bank-account-id',
          bankAccountLastDigits: '5678',
        } as PaymentOrderEntity,
      ]);

      clientService.findByIds.mockResolvedValue([
        {
          id: clientId,
          name: 'Test Client',
          bankAccounts: [
            {
              id: bankAccountId,
              name: 'Test Bank Account',
              plaidAccount: {
                bankName: 'Bank Of America',
              },
            },
          ],
        } as Client,
        {
          id: 'different-client-id',
          name: 'Different Client',
          bankAccounts: [
            {
              id: 'different-bank-account-id',
              name: 'Different Bank Account',
              plaidAccount: {
                bankName: 'Bank Of America',
              },
            },
          ],
        } as Client,
      ]);

      const result = await handler.execute(new ListTransfersQuery(criteria));

      expect(result.items).toHaveLength(1);
      expect(clientPaymentRepository.find).toHaveBeenCalled();
      expect(paymentOrderRepository.find).toHaveBeenCalled();
      expect(clientService.findByIds).toHaveBeenCalled();

      expect(result.items[0]).toEqual({
        id: 'batch-transfer-id',
        transfersId: transferId,
        counterpartyName: 'Different Client',
        amount: 100,
        transferType: TransferResponseV1PaymentType.Ach,
        failureReason: '',
        status: TransferResponseV1State.Completed,
        paymentDate: new Date('2025-12-01T12:00:00Z'),
        receivingAccount: 'Different Bank Account',
        bankAccountId: 'different-bank-account-id',
        lastFourDigits: '5678',
        counterpartyBankName: 'Bank Of America',
      });
    });

    it('should fetch next page when transfer details are empty but cursor exists', async () => {
      const criteria = new QueryCriteria();
      const nextCursor = 'next-page-cursor';

      transferApi.listTransfers.mockResolvedValueOnce({
        items: [
          {
            id: 'batch-id',
            transfers: [],
          },
        ] as unknown as BatchTransferResponseV1[],
        nextCursor,
      });

      clientPaymentRepository.find.mockResolvedValue([]);
      paymentOrderRepository.find.mockResolvedValue([]);

      transferApi.listTransfers.mockResolvedValueOnce({
        items: [],
        nextCursor: undefined,
      });

      await handler.execute(new ListTransfersQuery(criteria));

      expect(transferApi.listTransfers).toHaveBeenCalledTimes(2);

      const expectedNextPageCriteria = new QueryCriteria({
        ...criteria,
        filters: [
          new FilterCriteria({
            name: 'cursor',
            operator: FilterOperator.EQ,
            value: nextCursor,
          }),
        ],
      });
      expect(transferApi.listTransfers).toHaveBeenNthCalledWith(
        2,
        expectedNextPageCriteria,
      );
    });
  });
});
