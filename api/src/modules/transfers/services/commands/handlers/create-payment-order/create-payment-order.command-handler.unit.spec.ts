import { mockMikroORMProvider, mockToken } from '@core/test';
import { UUID } from '@core/uuid';
import {
  CreatePaymentOrderRequest,
  PaymentOrder,
} from '@fs-bobtail/factoring/data';
import {
  Client,
  ClientBankAccountService,
  ClientContactType,
  ClientService,
} from '@module-clients';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import {
  buildStubClientBankAccount,
  buildStubExpediteBatchTransferResponseV2,
  buildStubModernTreasuryAccount,
  buildStubPlaidAccount,
} from '../../../../../clients/test';
import {
  BatchTransferResponseV1TransferType,
  TransfersApi,
  TransferType,
} from '../../../../api';
import { TransferDataAccess, TransferDataMapper } from '../../common';
import { CreatePaymentOrderCommand } from '../../create-payment-order.command';
import { CreatePaymentOrderCommandHandler } from './create-payment-order.command-handler';

const createPaymentOrderRequest = (transferType: TransferType) => {
  return new CreatePaymentOrderRequest({
    clientId: 'client-id',
    bankAccountId: 'bank-account-id',
    transferType: transferType,
    amount: 345000,
  });
};

describe('CreatePaymentOrderCommandHandler', () => {
  let clientService: ClientService;
  let clientBankAccountService: ClientBankAccountService;
  let dataAccess: TransferDataAccess;
  let transferAPI: TransfersApi;
  let handler: CreatePaymentOrderCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreatePaymentOrderCommandHandler, mockMikroORMProvider],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    clientService = module.get(ClientService);
    clientBankAccountService = module.get(ClientBankAccountService);
    dataAccess = module.get(TransferDataAccess);
    transferAPI = module.get(TransfersApi);
    handler = module.get(CreatePaymentOrderCommandHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mock = () => {
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
      .spyOn(clientBankAccountService, 'getPrimaryFactoringBankAccountById')
      .mockResolvedValue(
        buildStubClientBankAccount({
          plaidAccount: buildStubPlaidAccount({
            bankAccountOfficialName: 'name',
          }),
          modernTreasuryAccount: buildStubModernTreasuryAccount({
            routingNumber: 'routing',
            account: '0000',
            externalAccountId: UUID.get(),
          }),
        }),
      );
    jest
      .spyOn(TransferDataMapper, 'bofaExpediteTransferToPaymentOrder')
      .mockReturnValue(
        new PaymentOrder({
          amount: 345,
          batchTransferId: 'batch-transfer-id',
          id: UUID.get(),
        }),
      );
    jest.spyOn(transferAPI, 'createBankOfAmericaAch').mockResolvedValue(
      buildStubExpediteBatchTransferResponseV2({
        transferType: BatchTransferResponseV1TransferType.Ach,
      }),
    );
    jest.spyOn(transferAPI, 'createBankOfAmericaWire').mockResolvedValue(
      buildStubExpediteBatchTransferResponseV2({
        transferType: BatchTransferResponseV1TransferType.Expedite,
      }),
    );
    jest.spyOn(transferAPI, 'createBankOfAmericaExpedite').mockResolvedValue(
      buildStubExpediteBatchTransferResponseV2({
        transferType: BatchTransferResponseV1TransferType.Expedite,
      }),
    );
  };

  describe('CreatePaymentOrderCommandHandler', () => {
    it('Payment order is persisted', async () => {
      mock();

      await handler.execute(
        new CreatePaymentOrderCommand(
          createPaymentOrderRequest(TransferType.Rtp),
        ),
      );

      const persistSpy = jest.spyOn(dataAccess, 'persist');
      expect(persistSpy).toBeCalledTimes(1);
    });

    it('Transfer API is called for Bofa expedite', async () => {
      mock();

      await handler.execute(
        new CreatePaymentOrderCommand(
          createPaymentOrderRequest(TransferType.Rtp),
        ),
      );

      const createExpediteSpy = jest.spyOn(
        transferAPI,
        'createBankOfAmericaExpedite',
      );
      expect(createExpediteSpy).toBeCalledTimes(1);
    });

    it('Transfer API is called for Bofa wire', async () => {
      mock();

      await handler.execute(
        new CreatePaymentOrderCommand(
          createPaymentOrderRequest(TransferType.Wire),
        ),
      );

      const createWire = jest.spyOn(transferAPI, 'createBankOfAmericaWire');
      expect(createWire).toBeCalledTimes(1);
    });

    it('Throws error on unsupported transfer type', async () => {
      mock();
      await expect(
        handler.execute(
          new CreatePaymentOrderCommand(
            new CreatePaymentOrderRequest({
              clientId: 'client-id',
              bankAccountId: 'bank-account-id',
              transferType: TransferType.Regular,
              amount: 345000,
            }),
          ),
        ),
      ).rejects.toThrowError();
    });
  });
});
