import { mockMikroORMProvider, mockToken } from '@core/test';
import { UUID } from '@core/uuid';
import { Client, ClientContactType, ClientService } from '@module-clients';
import { ExpediteConfigurer } from '@module-common';
import { FEATURE_TOGGLES_SERVICE } from '@module-feature-toggles';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import {
  ClientFactoringConfigsEntity,
  ClientPaymentStatus,
  InvoiceEntity,
} from '@module-persistence';
import { EntityStubs } from '@module-persistence/test';
import { RtpSupportService } from '@module-rtp';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import {
  buildStubClientBankAccount,
  buildStubPlaidAccount,
} from '../../../../../clients/test';
import { TransfersApi } from '../../../../api';
import { InitiateExpediteTransferRequest } from '../../../../data';
import { TransferDataAccess } from '../../common';
import { InitiateExpediteTransferCommand } from '../../initiate-expedite-transfer.command';
import { InitiateExpediteTransferCommandHandler } from './initiate-expedite-transfer.command-handler';

interface MockInput {
  invoices?: InvoiceEntity[];
  externalBankAccountIdentifier?: string;
  clientFactoringConfig?: ClientFactoringConfigsEntity;
}

describe('InitiateExpediteTransferCommandHandler', () => {
  let clientService: ClientService;
  let dataAccess: TransferDataAccess;
  let invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor;
  let transferAPI: TransfersApi;
  let handler: InitiateExpediteTransferCommandHandler;
  let expediteConfigurer: ExpediteConfigurer;
  let rtpSupportService: RtpSupportService;
  const id = UUID.get();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InitiateExpediteTransferCommandHandler,
        mockMikroORMProvider,
        {
          provide: FEATURE_TOGGLES_SERVICE,
          useValue: {
            isEnabledForClient: jest.fn().mockResolvedValue(false),
          },
        },
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    clientService = module.get(ClientService);
    dataAccess = module.get(TransferDataAccess);
    invoiceChangeActionsExecutor = module.get(InvoiceChangeActionsExecutor);
    transferAPI = module.get(TransfersApi);
    handler = module.get(InitiateExpediteTransferCommandHandler);
    expediteConfigurer = module.get(ExpediteConfigurer);
    rtpSupportService = module.get(RtpSupportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mock = (input: MockInput) => {
    jest
      .spyOn(dataAccess, 'getClientInvoicesForExpediteTransfer')
      .mockResolvedValueOnce(
        input.invoices || [EntityStubs.buildStubInvoice({ clientId: id })],
      );
    jest.spyOn(clientService, 'getOneById').mockResolvedValue(
      new Client({
        name: 'client',
        clientContacts: [
          {
            type: ClientContactType.BUSINESS,
            id: 'UUID_GOES_HERE',
            address: {
              address: '123 main st',
              city: 'city',
              state: 'state',
              country: 'US',
              zip: '12345',
              id: 'UUID_GOES_HERE',
              createdAt: new Date(),
              updatedAt: new Date(),
              createdBy: EntityStubs.buildUser(),
              updatedBy: EntityStubs.buildUser(),
            },
            primary: true,
            email: 'test@example.com',
            name: 'Business Contact',
            contactPhones: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: EntityStubs.buildUser(),
            updatedBy: EntityStubs.buildUser(),
            notifications: true,
          },
        ],
      }),
    );
    jest
      .spyOn(dataAccess, 'getClientFactoringConfig')
      .mockResolvedValue(
        input.clientFactoringConfig ||
          EntityStubs.buildClientFactoringConfig({ id }),
      );
    const clientBankAccountStub = buildStubClientBankAccount({
      plaidAccount: buildStubPlaidAccount({ bankAccountOfficialName: 'name' }),
      modernTreasuryAccount: {
        routingNumber: 'routing',
        account: '0000',
        externalAccountId: UUID.get(),
      },
    });
    jest
      .spyOn(clientService, 'getPrimaryBankAccount')
      .mockResolvedValue(clientBankAccountStub);
    jest.spyOn(expediteConfigurer, 'expediteFee').mockReturnValue(new Big(180));
    jest.spyOn(rtpSupportService, 'verifyAccounts').mockResolvedValue(['123']);
  };

  describe('InitiateExpediteTransferCommandHandler', () => {
    it('Throws error when no invoices are found', async () => {
      mock({
        invoices: [],
      });

      expect(
        handler.execute(
          new InitiateExpediteTransferCommand(
            new InitiateExpediteTransferRequest(),
          ),
        ),
      ).rejects.toThrowError();
    });

    describe('checkForRecentTransfers', () => {
      it('Should throw error when recent expedite transfer exists', async () => {
        jest
          .spyOn(dataAccess, 'hasRecentTransfersInitiated')
          .mockResolvedValue(true);

        const request = new InitiateExpediteTransferRequest();
        request.clientId = id;

        await expect(
          handler['checkForRecentTransfers'](request),
        ).rejects.toThrow(
          'This transfer has already been initiated by another user. Please refresh your page',
        );
      });

      it('Should not throw error when no recent expedite transfer exists', async () => {
        jest
          .spyOn(dataAccess, 'hasRecentTransfersInitiated')
          .mockResolvedValue(false);

        const request = new InitiateExpediteTransferRequest();
        request.clientId = id;

        await expect(
          handler['checkForRecentTransfers'](request),
        ).resolves.not.toThrow();
      });

      it('Should call hasRecentTransfersInitiated with correct clientId', async () => {
        const validateSpy = jest
          .spyOn(dataAccess, 'hasRecentTransfersInitiated')
          .mockResolvedValue(false);

        const request = new InitiateExpediteTransferRequest();
        request.clientId = id;

        await handler['checkForRecentTransfers'](request);

        expect(validateSpy).toHaveBeenCalledWith(id);
        expect(validateSpy).toHaveBeenCalledTimes(1);
      });
    });

    it('Should call hasRecentTransfersInitiated when no invoices are available to be sent and throw refreshing the page error', async () => {
      mock({
        invoices: [],
      });

      const validateSpy = jest
        .spyOn(dataAccess, 'hasRecentTransfersInitiated')
        .mockResolvedValue(true);

      const validateSpy2 = jest
        .spyOn(dataAccess, 'getClientInvoicesForExpediteTransfer')
        .mockResolvedValueOnce([]);

      const request = new InitiateExpediteTransferRequest();
      request.clientId = id;

      await expect(
        handler.execute(new InitiateExpediteTransferCommand(request)),
      ).rejects.toThrow(
        'This transfer has already been initiated by another user. Please refresh your page',
      );

      expect(validateSpy).toHaveBeenCalled();
      expect(validateSpy2).toHaveBeenCalled();
    });

    it('Should call hasRecentTransfersInitiated when no invoices are available to be sent and throw no invoices available error', async () => {
      mock({
        invoices: [],
      });

      const validateSpy = jest
        .spyOn(dataAccess, 'hasRecentTransfersInitiated')
        .mockResolvedValue(false);
      const validateSpy2 = jest
        .spyOn(dataAccess, 'getClientInvoicesForExpediteTransfer')
        .mockResolvedValue([]);

      const request = new InitiateExpediteTransferRequest();
      request.clientId = id;

      await expect(
        handler.execute(new InitiateExpediteTransferCommand(request)),
      ).rejects.toThrow('No invoices available for expedite transfer');

      expect(validateSpy).toHaveBeenCalled();
      expect(validateSpy2).toHaveBeenCalled();
    });

    describe('validateTransferDestination', () => {
      it('Should throw error when transfer destination is null', () => {
        const bankAccount = buildStubClientBankAccount();
        const clientId = UUID.get();

        expect(() => {
          (handler as any).validateTransferDestination(
            null,
            bankAccount,
            clientId,
          );
        }).toThrow('Client does not have a valid bank account');
      });

      it('Should throw error when transfer destination has no bank name', () => {
        const transferDestination = {
          bankName: null,
          routingNumber: '123456789',
          accountNumber: '987654321',
        } as any;
        const bankAccount = buildStubClientBankAccount();
        const clientId = UUID.get();

        expect(() => {
          (handler as any).validateTransferDestination(
            transferDestination,
            bankAccount,
            clientId,
          );
        }).toThrow(
          'Client does not have a bank name associated with its bank account in order to expedite transfer',
        );
      });

      it('Should throw error when transfer destination has empty bank name', () => {
        const transferDestination = {
          bankName: '',
          routingNumber: '123456789',
          accountNumber: '987654321',
        } as any;
        const bankAccount = buildStubClientBankAccount();
        const clientId = UUID.get();

        expect(() => {
          (handler as any).validateTransferDestination(
            transferDestination,
            bankAccount,
            clientId,
          );
        }).toThrow(
          'Client does not have a bank name associated with its bank account in order to expedite transfer',
        );
      });

      it('Should not throw error when transfer destination is valid', () => {
        const transferDestination = {
          bankName: 'Chase Bank',
          routingNumber: '123456789',
          accountNumber: '987654321',
        } as any;
        const bankAccount = buildStubClientBankAccount();
        const clientId = UUID.get();

        expect(() => {
          (handler as any).validateTransferDestination(
            transferDestination,
            bankAccount,
            clientId,
          );
        }).not.toThrow();
      });
    });

    it('Batch client payments is persisted', async () => {
      mock({
        invoices: [EntityStubs.buildStubInvoice()],
      });

      await handler.execute(
        new InitiateExpediteTransferCommand(
          new InitiateExpediteTransferRequest(),
        ),
      );

      const persistSpy = jest.spyOn(dataAccess, 'persist');
      expect(persistSpy).toBeCalledTimes(1);
    });

    it('Transfer API is called for Modern Treasury', async () => {
      mock({
        invoices: [EntityStubs.buildStubInvoice()],
      });

      await handler.execute(
        new InitiateExpediteTransferCommand(
          new InitiateExpediteTransferRequest(),
        ),
      );

      const createExpediteSpy = jest.spyOn(
        transferAPI,
        'createModernTreasuryExpedite',
      );
      expect(createExpediteSpy).toBeCalledTimes(1);
    });

    it('Transfer API is called for Bofa', async () => {
      const featureService = handler['featureTogglesService']; // or get from DI
      jest
        .spyOn(featureService, 'isEnabledForClient')
        .mockResolvedValueOnce(true);
      mock({
        invoices: [EntityStubs.buildStubInvoice()],
      });

      await handler.execute(
        new InitiateExpediteTransferCommand(
          new InitiateExpediteTransferRequest(),
        ),
      );

      const createExpediteSpy = jest.spyOn(
        transferAPI,
        'createBankOfAmericaExpediteOnApiEnabled',
      );
      expect(createExpediteSpy).toBeCalledTimes(1);
    });

    it('Client Expedite and Done Submitting invoices flags are set to false', async () => {
      const clientFactoringConfig = EntityStubs.buildClientFactoringConfig({
        id,
        expediteTransferOnly: true,
        doneSubmittingInvoices: true,
      });
      mock({
        invoices: [EntityStubs.buildStubInvoice()],
        clientFactoringConfig,
      });

      expect(clientFactoringConfig.expediteTransferOnly).toBe(true);
      expect(clientFactoringConfig.doneSubmittingInvoices).toBe(true);

      await handler.execute(
        new InitiateExpediteTransferCommand(
          new InitiateExpediteTransferRequest(),
        ),
      );

      expect(clientFactoringConfig.expediteTransferOnly).toBe(false);
      expect(clientFactoringConfig.doneSubmittingInvoices).toBe(false);
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
            expedited: true,
          }),
          EntityStubs.buildStubInvoice({
            accountsReceivableValue: new Big(1000),
            deduction: new Big(20),
            reserveFee: new Big(20),
            approvedFactorFee: new Big(20),
            clientId: '',
            expedited: false,
          }),
        ],
      });

      const batchPayment = await handler.execute(
        new InitiateExpediteTransferCommand(
          new InitiateExpediteTransferRequest(),
        ),
      );

      const applySpy = jest.spyOn(invoiceChangeActionsExecutor, 'apply');
      expect(applySpy).toBeCalledTimes(2);
      expect(batchPayment.clientPayments.length).toBe(1);

      const clientPayment = batchPayment.clientPayments[0];
      expect(clientPayment.invoicePayments).toBeDefined();
      if (clientPayment.invoicePayments) {
        expect(clientPayment.invoicePayments.length).toBe(2);
        expect(clientPayment.invoicePayments[0].amount.toNumber()).toBe(970);
        expect(clientPayment.invoicePayments[1].amount.toNumber()).toBe(940);
        expect(clientPayment.amount.toNumber()).toBe(1730);

        const invoices = clientPayment.invoicePayments.map(
          (invoicePayment) => invoicePayment.invoice,
        );
        expect(invoices).toBeDefined();
        expect(invoices.length).toBeGreaterThan(0);
        for (const invoice of invoices) {
          expect(invoice.clientPaymentStatus).toBe(ClientPaymentStatus.Sent);
        }
      }
    });

    it('Throws error when bank account supports neither wire nor RTP', async () => {
      mock({
        invoices: [EntityStubs.buildStubInvoice()],
      });

      // Override the default mock to have NO wire support
      const clientBankAccountStub = buildStubClientBankAccount({
        plaidAccount: buildStubPlaidAccount({
          bankAccountOfficialName: 'name',
        }),
        modernTreasuryAccount: {
          routingNumber: 'routing',
          account: '0000',
          externalAccountId: UUID.get(),
          confirmedWire: false,
        },
      });

      clientBankAccountStub.plaidAccount.wireRoutingNumber = undefined;
      clientBankAccountStub.modernTreasuryAccount.wireRoutingNumber = null;
      jest
        .spyOn(clientService, 'getPrimaryBankAccount')
        .mockResolvedValue(clientBankAccountStub);

      jest.spyOn(rtpSupportService, 'verifyAccounts').mockResolvedValue([]);

      await expect(
        handler.execute(
          new InitiateExpediteTransferCommand(
            new InitiateExpediteTransferRequest(),
          ),
        ),
      ).rejects.toThrow();
    });

    it('Does not throw error when bank account supports RTP (even if no wire)', async () => {
      mock({
        invoices: [EntityStubs.buildStubInvoice()],
      });

      const clientBankAccountStub = buildStubClientBankAccount({
        id: 'bank-account-id',
        plaidAccount: buildStubPlaidAccount({
          bankAccountOfficialName: 'name',
        }),
        modernTreasuryAccount: {
          routingNumber: 'routing',
          account: '0000',
          externalAccountId: UUID.get(),
          confirmedWire: false,
        },
      });

      clientBankAccountStub.plaidAccount.wireRoutingNumber = undefined;
      clientBankAccountStub.modernTreasuryAccount.wireRoutingNumber = null;
      jest
        .spyOn(clientService, 'getPrimaryBankAccount')
        .mockResolvedValue(clientBankAccountStub);
      jest
        .spyOn(rtpSupportService, 'verifyAccounts')
        .mockResolvedValue(['bank-account-id']);

      await expect(
        handler.execute(
          new InitiateExpediteTransferCommand(
            new InitiateExpediteTransferRequest(),
          ),
        ),
      ).resolves.toBeDefined();
    });

    it('Does not call RTP verify when bank account supports Wire', async () => {
      mock({
        invoices: [EntityStubs.buildStubInvoice()],
      });

      const clientBankAccountStub = buildStubClientBankAccount({
        wireRoutingNumber: '123456789',
      });
      jest
        .spyOn(clientService, 'getPrimaryBankAccount')
        .mockResolvedValue(clientBankAccountStub);

      const rtpSpy = jest.spyOn(rtpSupportService, 'verifyAccounts');

      await handler.execute(
        new InitiateExpediteTransferCommand(
          new InitiateExpediteTransferRequest(),
        ),
      );

      expect(rtpSpy).not.toHaveBeenCalled();
    });
  });
});
