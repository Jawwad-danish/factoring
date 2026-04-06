import { getDateInBusinessTimezone } from '@core/date-time';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ClientService } from '@module-clients';
import { TransferTime, TransferTimeService } from '@module-common';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import {
  ClientPaymentStatus,
  InvoiceEntity,
  ReserveEntity,
  ClientBatchPaymentEntity,
  ClientBatchPaymentStatus,
  ClientFactoringStatus,
} from '@module-persistence/entities';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import {
  buildStubClient,
  buildStubClientBankAccount,
} from '../../../../../clients/test';
import { TransfersApi } from '../../../../api';
import { InitiateRegularTransferRequest } from '../../../../data';
import { TransferDataAccess } from '../../common';
import { InitiateRegularTransferCommand } from '../../initiate-regular-transfer.command';
import { InitiateRegularTransferCommandHandler } from './initiate-regular-transfer.command-handler';
import {
  ClientBankAccountStatus,
  ProductName,
} from '@fs-bobtail/factoring/data';

interface MockInput {
  invoices?: InvoiceEntity[];
  externalBankAccountIdentifier?: string;
  reserves?: ReserveEntity[];
  currentTransferTime?: TransferTime | null;
  lastTransferTimeOfTheDay?: TransferTime;
  isRegularBatchPaymentInProgress?: boolean;
}

describe('InitiateRegularTransferCommandHandler', () => {
  let handler: InitiateRegularTransferCommandHandler;
  let clientService: DeepMocked<ClientService>;
  let dataAccess: DeepMocked<TransferDataAccess>;
  let invoiceChangeActionsExecutor: DeepMocked<InvoiceChangeActionsExecutor>;
  let transferAPI: DeepMocked<TransfersApi>;
  let transferTimeService: DeepMocked<TransferTimeService>;

  beforeEach(async () => {
    clientService = createMock<ClientService>();
    dataAccess = createMock<TransferDataAccess>();
    invoiceChangeActionsExecutor = createMock<InvoiceChangeActionsExecutor>();
    transferAPI = createMock<TransfersApi>();
    transferTimeService = createMock<TransferTimeService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InitiateRegularTransferCommandHandler,
        mockMikroORMProvider,
        TransferTimeService,
        ClientService,
        TransferDataAccess,
        InvoiceChangeActionsExecutor,
        TransfersApi,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .overrideProvider(TransferTimeService)
      .useValue(transferTimeService)
      .overrideProvider(ClientService)
      .useValue(clientService)
      .overrideProvider(TransferDataAccess)
      .useValue(dataAccess)
      .overrideProvider(InvoiceChangeActionsExecutor)
      .useValue(invoiceChangeActionsExecutor)
      .overrideProvider(TransfersApi)
      .useValue(transferAPI)
      .compile();

    handler = module.get(InitiateRegularTransferCommandHandler);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const mock = (input: MockInput) => {
    dataAccess.getInvoicesForRegularTransfer.mockResolvedValueOnce(
      input.invoices || [EntityStubs.buildStubInvoice()],
    );
    dataAccess.isRegularBatchPaymentInProgress.mockResolvedValueOnce(
      input.isRegularBatchPaymentInProgress || false,
    );
    dataAccess.getReleaseOfFunds.mockResolvedValueOnce(input.reserves || []);

    clientService.findByIds.mockImplementationOnce((ids: string[]) => {
      return Promise.resolve(
        ids.map((id) => {
          const bankAccountStub = buildStubClientBankAccount({
            status: ClientBankAccountStatus.Active,
          });
          const clientStub = buildStubClient({
            id: id,
          });
          clientStub.bankAccounts = [bankAccountStub];
          return clientStub;
        }),
      );
    });

    transferTimeService.getTransferTimeInBusinessTimezone.mockReturnValueOnce({
      send: getDateInBusinessTimezone(),
      cutoff: getDateInBusinessTimezone(),
    });

    transferTimeService.getRegularArrivalTime.mockReturnValueOnce(new Date());

    const defaultTransferTime: TransferTime = {
      name: 'first_ach',
      cutoff: {
        hour: 13,
        minute: 0,
      },
      send: {
        hour: 15,
        minute: 0,
      },
    };
    transferTimeService.getCurrentTransferWindow.mockReturnValueOnce(
      input.currentTransferTime === undefined
        ? defaultTransferTime
        : input.currentTransferTime,
    );
    transferTimeService.getLastTransferTimeOfTheDay.mockReturnValueOnce(
      input.lastTransferTimeOfTheDay || defaultTransferTime,
    );
  };

  describe('InitiateRegularTransferCommandHandler', () => {
    it('Throws error when there is another transfer in progress', async () => {
      mock({
        isRegularBatchPaymentInProgress: true,
      });

      await expect(
        handler.execute(
          new InitiateRegularTransferCommand(
            new InitiateRegularTransferRequest(),
          ),
        ),
      ).rejects.toThrowError();
    });

    it('Throws error when no invoices and release of funds are found', async () => {
      mock({
        invoices: [],
        reserves: [],
      });

      await expect(
        handler.execute(
          new InitiateRegularTransferCommand(
            new InitiateRegularTransferRequest(),
          ),
        ),
      ).rejects.toThrowError();
    });

    it('Entities are persisted and flushed', async () => {
      const invoicesMock = [EntityStubs.buildStubInvoice()];
      mock({
        invoices: invoicesMock,
      });

      const batchPayment = await handler.execute(
        new InitiateRegularTransferCommand(
          new InitiateRegularTransferRequest(),
        ),
      );

      const persistSpy = jest.spyOn(dataAccess, 'persistAndFlush');
      expect(persistSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: batchPayment.id }),
          ...invoicesMock,
        ]),
      );
      invoicesMock.forEach((invoice) => {
        expect(invoice.clientPaymentStatus).toEqual(
          ClientPaymentStatus.InProgress,
        );
      });
    });

    it('Transfer API is called', async () => {
      mock({
        invoices: [EntityStubs.buildStubInvoice()],
      });

      await handler.execute(
        new InitiateRegularTransferCommand(
          new InitiateRegularTransferRequest(),
        ),
      );

      const createAchBatchSpy = jest.spyOn(transferAPI, 'createAchBatch');
      expect(createAchBatchSpy).toBeCalledTimes(1);
    });

    it('Invoices are added to the client payment', async () => {
      mock({
        invoices: [
          EntityStubs.buildStubInvoice({
            accountsReceivableValue: new Big(1000),
            deduction: new Big(10),
            reserveFee: new Big(10),
            approvedFactorFee: new Big(10),
            clientId: '',
          }),
          EntityStubs.buildStubInvoice({
            accountsReceivableValue: new Big(1000),
            deduction: new Big(20),
            reserveFee: new Big(20),
            approvedFactorFee: new Big(20),
            clientId: '',
          }),
        ],
      });

      const batchPayment = await handler.execute(
        new InitiateRegularTransferCommand(
          new InitiateRegularTransferRequest(),
        ),
      );

      const applySpy = jest.spyOn(invoiceChangeActionsExecutor, 'apply');
      expect(applySpy).toBeCalledTimes(2);
      expect(batchPayment.clientPayments.length).toBe(1);

      const clientPayment = batchPayment.clientPayments[0];

      expect(clientPayment.invoicePayments).toBeDefined();
      expect(clientPayment.reservePayments).toBeDefined();
      if (clientPayment.invoicePayments && clientPayment.reservePayments) {
        expect(clientPayment.invoicePayments.length).toBe(2);
        expect(clientPayment.invoicePayments[0].amount.toNumber()).toBe(970);
        expect(clientPayment.invoicePayments[1].amount.toNumber()).toBe(940);
        expect(clientPayment.amount.toNumber()).toBe(1910);
        expect(clientPayment.reservePayments.length).toBe(0);

        const invoices = clientPayment.invoicePayments.map(
          (invoicePayment) => invoicePayment.invoice,
        );
        expect(invoices).toBeDefined();
        expect(invoices.length).toBeGreaterThan(0);
        for (const invoice of invoices) {
          expect(invoice.clientPaymentStatus).toBe(
            ClientPaymentStatus.InProgress,
          );
        }
      }
    });

    it('Reserves are added to the client payment', async () => {
      mock({
        invoices: [],
        reserves: [
          EntityStubs.buildStubReserve({
            amount: new Big(-100),
          }),
        ],
      });

      const batchPayment = await handler.execute(
        new InitiateRegularTransferCommand(
          new InitiateRegularTransferRequest(),
        ),
      );

      const applySpy = jest.spyOn(invoiceChangeActionsExecutor, 'apply');
      expect(applySpy).toBeCalledTimes(0);
      expect(batchPayment.clientPayments.length).toBe(1);

      const clientPayment = batchPayment.clientPayments[0];
      expect(clientPayment.invoicePayments).toBeDefined();
      expect(clientPayment.reservePayments).toBeDefined();
      if (clientPayment.invoicePayments && clientPayment.reservePayments) {
        expect(clientPayment.amount.toNumber()).toBe(100);
        expect(clientPayment.invoicePayments.length).toBe(0);
        expect(clientPayment.reservePayments.length).toBe(1);
        expect(clientPayment.reservePayments[0].amount.toNumber()).toBe(100);
      }
    });

    it('Invoices and reserves are added to the client payment', async () => {
      mock({
        invoices: [
          EntityStubs.buildStubInvoice({
            accountsReceivableValue: new Big(1000),
            deduction: new Big(10),
            reserveFee: new Big(10),
            approvedFactorFee: new Big(10),
            clientId: '',
          }),
          EntityStubs.buildStubInvoice({
            accountsReceivableValue: new Big(1000),
            deduction: new Big(20),
            reserveFee: new Big(20),
            approvedFactorFee: new Big(20),
            clientId: '',
          }),
        ],
        reserves: [
          EntityStubs.buildStubReserve({
            amount: new Big(-100),
            clientId: '',
          }),
        ],
      });

      const batchPayment = await handler.execute(
        new InitiateRegularTransferCommand(
          new InitiateRegularTransferRequest(),
        ),
      );

      const applySpy = jest.spyOn(invoiceChangeActionsExecutor, 'apply');
      expect(applySpy).toBeCalledTimes(2);
      expect(batchPayment.clientPayments.length).toBe(1);

      const clientPayment = batchPayment.clientPayments[0];
      expect(clientPayment.invoicePayments).toBeDefined();
      expect(clientPayment.reservePayments).toBeDefined();
      if (clientPayment.invoicePayments && clientPayment.reservePayments) {
        expect(clientPayment.invoicePayments.length).toBe(2);
        expect(clientPayment.invoicePayments[0].amount.toNumber()).toBe(970);
        expect(clientPayment.invoicePayments[1].amount.toNumber()).toBe(940);
        expect(clientPayment.amount.toNumber()).toBe(2010);
        expect(clientPayment.reservePayments?.length).toBe(1);
        expect(clientPayment.reservePayments[0].amount.toNumber()).toBe(100);
      }
    });

    it('Expedite invoices are included if inside last transfer window', async () => {
      const transferTime: TransferTime = {
        name: 'first_ach',
        cutoff: {
          hour: 13,
          minute: 0,
        },
        send: {
          hour: 15,
          minute: 0,
        },
      };

      mock({
        invoices: [
          EntityStubs.buildStubInvoice({
            accountsReceivableValue: new Big(1000),
            deduction: new Big(10),
            reserveFee: new Big(10),
            approvedFactorFee: new Big(10),
            clientId: '',
          }),
          EntityStubs.buildStubInvoice({
            accountsReceivableValue: new Big(1000),
            deduction: new Big(20),
            reserveFee: new Big(20),
            approvedFactorFee: new Big(20),
            clientId: '',
          }),
        ],
        reserves: [
          EntityStubs.buildStubReserve({
            amount: new Big(-100),
            clientId: '',
          }),
        ],
        currentTransferTime: transferTime,
        lastTransferTimeOfTheDay: transferTime,
      });

      const fetchSpy = jest.spyOn(dataAccess, 'getInvoicesForRegularTransfer');

      await handler.execute(
        new InitiateRegularTransferCommand(
          new InitiateRegularTransferRequest(),
        ),
      );
      expect(fetchSpy.mock.calls[0][0]).toBe(true);
    });

    it('Expedite invoices are not included if not inside last transfer window', async () => {
      const transferTime: TransferTime = {
        name: 'first_ach',
        cutoff: {
          hour: 13,
          minute: 0,
        },
        send: {
          hour: 15,
          minute: 0,
        },
      };
      const lastTransferTime: TransferTime = {
        name: 'second_ach',
        cutoff: {
          hour: 17,
          minute: 0,
        },
        send: {
          hour: 22,
          minute: 0,
        },
      };

      mock({
        invoices: [
          EntityStubs.buildStubInvoice({
            accountsReceivableValue: new Big(1000),
            deduction: new Big(10),
            reserveFee: new Big(10),
            approvedFactorFee: new Big(10),
            clientId: '',
          }),
          EntityStubs.buildStubInvoice({
            accountsReceivableValue: new Big(1000),
            deduction: new Big(20),
            reserveFee: new Big(20),
            approvedFactorFee: new Big(20),
            clientId: '',
          }),
        ],
        reserves: [
          EntityStubs.buildStubReserve({
            amount: new Big(-100),
            clientId: '',
          }),
        ],
        currentTransferTime: transferTime,
        lastTransferTimeOfTheDay: lastTransferTime,
      });

      await handler.execute(
        new InitiateRegularTransferCommand(
          new InitiateRegularTransferRequest(),
        ),
      );
      expect(dataAccess.getInvoicesForRegularTransfer.mock.calls[0][0]).toBe(
        false,
      );
    });

    it('If not during a transfer window, expedite invoices are not included', async () => {
      const lastTransferTime: TransferTime = {
        name: 'second_ach',
        cutoff: {
          hour: 17,
          minute: 0,
        },
        send: {
          hour: 22,
          minute: 0,
        },
      };

      mock({
        invoices: [
          EntityStubs.buildStubInvoice({
            accountsReceivableValue: new Big(1000),
            deduction: new Big(10),
            reserveFee: new Big(10),
            approvedFactorFee: new Big(10),
            clientId: '',
          }),
          EntityStubs.buildStubInvoice({
            accountsReceivableValue: new Big(1000),
            deduction: new Big(20),
            reserveFee: new Big(20),
            approvedFactorFee: new Big(20),
            clientId: '',
          }),
        ],
        reserves: [
          EntityStubs.buildStubReserve({
            amount: new Big(-100),
            clientId: '',
          }),
        ],
        currentTransferTime: null,
        lastTransferTimeOfTheDay: lastTransferTime,
      });

      await handler.execute(
        new InitiateRegularTransferCommand(
          new InitiateRegularTransferRequest(),
        ),
      );
      expect(dataAccess.getInvoicesForRegularTransfer.mock.calls[0][0]).toBe(
        false,
      );
    });
  });

  describe('Client & Bank Account Filtering', () => {
    it('Excludes inactive clients from transfer', async () => {
      const inactiveClient = buildStubClient({
        id: 'inactive-client-id',
      });
      inactiveClient.factoringConfig.status = ClientFactoringStatus.Hold;

      dataAccess.getInvoicesForRegularTransfer.mockResolvedValueOnce([
        EntityStubs.buildStubInvoice({ clientId: 'inactive-client-id' }),
      ]);
      dataAccess.isRegularBatchPaymentInProgress.mockResolvedValueOnce(false);
      dataAccess.getReleaseOfFunds.mockResolvedValueOnce([]);
      clientService.findByIds.mockResolvedValueOnce([inactiveClient]);
      transferTimeService.getTransferTimeInBusinessTimezone.mockReturnValueOnce(
        {
          send: getDateInBusinessTimezone(),
          cutoff: getDateInBusinessTimezone(),
        },
      );
      transferTimeService.getRegularArrivalTime.mockReturnValueOnce(new Date());
      transferTimeService.getCurrentTransferWindow.mockReturnValueOnce({
        name: 'first_ach',
        cutoff: { hour: 13, minute: 0 },
        send: { hour: 15, minute: 0 },
      });
      transferTimeService.getLastTransferTimeOfTheDay.mockReturnValueOnce({
        name: 'first_ach',
        cutoff: { hour: 13, minute: 0 },
        send: { hour: 15, minute: 0 },
      });

      await expect(
        handler.execute(
          new InitiateRegularTransferCommand(
            new InitiateRegularTransferRequest(),
          ),
        ),
      ).rejects.toThrowError();
    });

    it('Excludes clients without primary bank account', async () => {
      const clientWithoutBankAccount = buildStubClient({
        id: 'no-bank-account-client-id',
      });
      clientWithoutBankAccount.bankAccounts = [];

      dataAccess.getInvoicesForRegularTransfer.mockResolvedValueOnce([
        EntityStubs.buildStubInvoice({
          clientId: 'no-bank-account-client-id',
        }),
      ]);
      dataAccess.isRegularBatchPaymentInProgress.mockResolvedValueOnce(false);
      dataAccess.getReleaseOfFunds.mockResolvedValueOnce([]);
      clientService.findByIds.mockResolvedValueOnce([clientWithoutBankAccount]);
      transferTimeService.getTransferTimeInBusinessTimezone.mockReturnValueOnce(
        {
          send: getDateInBusinessTimezone(),
          cutoff: getDateInBusinessTimezone(),
        },
      );
      transferTimeService.getRegularArrivalTime.mockReturnValueOnce(new Date());
      transferTimeService.getCurrentTransferWindow.mockReturnValueOnce({
        name: 'first_ach',
        cutoff: { hour: 13, minute: 0 },
        send: { hour: 15, minute: 0 },
      });
      transferTimeService.getLastTransferTimeOfTheDay.mockReturnValueOnce({
        name: 'first_ach',
        cutoff: { hour: 13, minute: 0 },
        send: { hour: 15, minute: 0 },
      });

      await expect(
        handler.execute(
          new InitiateRegularTransferCommand(
            new InitiateRegularTransferRequest(),
          ),
        ),
      ).rejects.toThrowError();
    });

    it('Excludes clients with inactive bank accounts', async () => {
      const inactiveBankAccount = buildStubClientBankAccount({
        status: ClientBankAccountStatus.Inactive,
      });
      const clientWithInactiveBankAccount = buildStubClient({
        id: 'inactive-bank-account-client-id',
      });

      clientWithInactiveBankAccount.bankAccounts = [inactiveBankAccount];

      dataAccess.getInvoicesForRegularTransfer.mockResolvedValueOnce([
        EntityStubs.buildStubInvoice({
          clientId: 'inactive-bank-account-client-id',
        }),
      ]);
      dataAccess.isRegularBatchPaymentInProgress.mockResolvedValueOnce(false);
      dataAccess.getReleaseOfFunds.mockResolvedValueOnce([]);
      clientService.findByIds.mockResolvedValueOnce([
        clientWithInactiveBankAccount,
      ]);
      transferTimeService.getTransferTimeInBusinessTimezone.mockReturnValueOnce(
        {
          send: getDateInBusinessTimezone(),
          cutoff: getDateInBusinessTimezone(),
        },
      );
      transferTimeService.getRegularArrivalTime.mockReturnValueOnce(new Date());
      transferTimeService.getCurrentTransferWindow.mockReturnValueOnce({
        name: 'first_ach',
        cutoff: { hour: 13, minute: 0 },
        send: { hour: 15, minute: 0 },
      });
      transferTimeService.getLastTransferTimeOfTheDay.mockReturnValueOnce({
        name: 'first_ach',
        cutoff: { hour: 13, minute: 0 },
        send: { hour: 15, minute: 0 },
      });

      await expect(
        handler.execute(
          new InitiateRegularTransferCommand(
            new InitiateRegularTransferRequest(),
          ),
        ),
      ).rejects.toThrowError();
    });

    it('Excludes bank accounts with only Card products', async () => {
      const cardOnlyBankAccount = buildStubClientBankAccount({
        status: ClientBankAccountStatus.Active,
        products: [{ name: ProductName.Card }],
      });
      const cardOnlyClient = buildStubClient({
        id: 'card-only-client-id',
      });

      cardOnlyClient.bankAccounts = [cardOnlyBankAccount];

      dataAccess.getInvoicesForRegularTransfer.mockResolvedValueOnce([
        EntityStubs.buildStubInvoice({ clientId: 'card-only-client-id' }),
      ]);
      dataAccess.isRegularBatchPaymentInProgress.mockResolvedValueOnce(false);
      dataAccess.getReleaseOfFunds.mockResolvedValueOnce([]);
      clientService.findByIds.mockResolvedValueOnce([cardOnlyClient]);
      transferTimeService.getTransferTimeInBusinessTimezone.mockReturnValueOnce(
        {
          send: getDateInBusinessTimezone(),
          cutoff: getDateInBusinessTimezone(),
        },
      );
      transferTimeService.getRegularArrivalTime.mockReturnValueOnce(new Date());
      transferTimeService.getCurrentTransferWindow.mockReturnValueOnce({
        name: 'first_ach',
        cutoff: { hour: 13, minute: 0 },
        send: { hour: 15, minute: 0 },
      });
      transferTimeService.getLastTransferTimeOfTheDay.mockReturnValueOnce({
        name: 'first_ach',
        cutoff: { hour: 13, minute: 0 },
        send: { hour: 15, minute: 0 },
      });

      await expect(
        handler.execute(
          new InitiateRegularTransferCommand(
            new InitiateRegularTransferRequest(),
          ),
        ),
      ).rejects.toThrowError();
    });
  });

  describe('Error Handling & State Reversion', () => {
    it('Reverts state when fetching transfer destinations fails', async () => {
      mock({});
      clientService.findByIds.mockReset();
      clientService.findByIds.mockRejectedValueOnce(
        new Error('Client Service Error'),
      );

      const persistSpy = jest.spyOn(dataAccess, 'persistAndFlush');

      await expect(
        handler.execute(
          new InitiateRegularTransferCommand(
            new InitiateRegularTransferRequest(),
          ),
        ),
      ).rejects.toThrow('Client Service Error');

      // 1: Step 2 (batch + invoices)
      // 2: Revert persistence
      expect(persistSpy).toHaveBeenCalledTimes(2);

      const lastCallArgs = persistSpy.mock.calls[1][0];
      const entities = Array.isArray(lastCallArgs)
        ? lastCallArgs
        : [lastCallArgs];
      const batchPayment = entities.find(
        (e) => e instanceof ClientBatchPaymentEntity,
      ) as ClientBatchPaymentEntity;

      expect(batchPayment.status).toBe(ClientBatchPaymentStatus.Failed);
    });

    it('Reverts state when persistence fails', async () => {
      mock({});
      const persistSpy = jest.spyOn(dataAccess, 'persistAndFlush');
      persistSpy
        .mockResolvedValueOnce(undefined) // Step 2 (batch + invoices)
        .mockRejectedValueOnce(new Error('DB Error')) // Step 6 (fail)
        .mockResolvedValueOnce(undefined); // Revert step

      await expect(
        handler.execute(
          new InitiateRegularTransferCommand(
            new InitiateRegularTransferRequest(),
          ),
        ),
      ).rejects.toThrow('DB Error');

      expect(persistSpy).toHaveBeenCalledTimes(3);
    });

    it('Reverts state when transfer initiation fails', async () => {
      mock({
        invoices: [EntityStubs.buildStubInvoice()],
      });
      const error = new Error('API Error');
      transferAPI.createAchBatch.mockRejectedValueOnce(error);

      const persistSpy = jest.spyOn(dataAccess, 'persistAndFlush');

      await expect(
        handler.execute(
          new InitiateRegularTransferCommand(
            new InitiateRegularTransferRequest(),
          ),
        ),
      ).rejects.toThrow(error);

      // 1: Step 2 (batch + invoices)
      // 2: Step 6 (persist everything)
      // 3: Revert persistence
      expect(persistSpy).toHaveBeenCalledTimes(3);

      const lastCallArgs = persistSpy.mock.calls[2][0];
      const entities = Array.isArray(lastCallArgs)
        ? lastCallArgs
        : [lastCallArgs];
      const batchPayment = entities.find(
        (e) => e instanceof ClientBatchPaymentEntity,
      ) as ClientBatchPaymentEntity;

      expect(batchPayment.status).toBe(ClientBatchPaymentStatus.Failed);
    });
  });
});
