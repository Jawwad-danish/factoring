import { mockMikroORMProvider, mockToken } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import { Client, ClientService } from '@module-clients';
import {
  buildStubClient,
  buildStubClientBankAccount,
  buildStubModernTreasuryAccount,
  buildStubPlaidAccount,
} from '@module-clients/test';
import { TransferTime, TransferTimeService } from '@module-common';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import { UUID } from '@core/uuid';
import { TransfersApi } from '../../../../api';
import { InitiateDebitRegularTransferRequest } from '../../../../data';
import { InitiateDebitRegularTransferCommand } from '../../initiate-debit-regular-transfer.command';
import { InitiateDebitRegularTransferCommandHandler } from './initiate-debit-regular-transfer.command-handler';

interface MockInput {
  client?: Client;
  externalBankAccountIdentifier?: string;
  currentTransferTime?: TransferTime | null;
  lastTransferTimeOfTheDay?: TransferTime;
}

describe('InitiateDebitRegularTransferCommandHandler', () => {
  let handler: InitiateDebitRegularTransferCommandHandler;
  const clientService = createMock<ClientService>();
  const transferAPI = createMock<TransfersApi>();
  const transferTimeService = createMock<TransferTimeService>();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InitiateDebitRegularTransferCommandHandler,
        mockMikroORMProvider,
        TransferTimeService,
        ClientService,
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
      .overrideProvider(TransfersApi)
      .useValue(transferAPI)
      .compile();

    handler = module.get(InitiateDebitRegularTransferCommandHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mock = (input: MockInput) => {
    clientService.getOneById.mockResolvedValueOnce(
      input.client || buildStubClient(),
    );

    transferTimeService.getRegularArrivalTime.mockReturnValueOnce(new Date());
  };

  describe('InitiateDebitRegularTransferCommandHandler', () => {
    it('Throws error when the bank account is not found for the client', async () => {
      const client = buildStubClient();
      mock({ client });

      expect(
        handler.execute(
          new InitiateDebitRegularTransferCommand(
            new InitiateDebitRegularTransferRequest({
              clientId: client.id,
              amount: Big(200),
              bankAccountId: '456',
            }),
          ),
        ),
      ).rejects.toThrowError(
        `Bank account 456 could not be found for client ${client.id}`,
      );
    });

    it('Throws error when the bank account is found but is not valid', async () => {
      const clientStub = buildStubClient();
      const invalidBankAccountStub = buildStubClientBankAccount({
        plaidAccount: buildStubPlaidAccount({
          bankAccountOfficialName: 'name',
        }),
        modernTreasuryAccount: buildStubModernTreasuryAccount({
          routingNumber: undefined,
          wireRoutingNumber: undefined,
          account: '0000',
          externalAccountId: UUID.get(),
        }),
      });
      clientStub.bankAccounts = [invalidBankAccountStub];
      mock({ client: clientStub });

      expect(
        handler.execute(
          new InitiateDebitRegularTransferCommand(
            new InitiateDebitRegularTransferRequest({
              clientId: clientStub.id,
              amount: Big(200),
              bankAccountId: invalidBankAccountStub.id,
            }),
          ),
        ),
      ).rejects.toThrowError('Selected bank account is not valid');
    });

    it('Happy path', async () => {
      const client = buildStubClient();

      expect(client.bankAccounts).toBeDefined();
      expect(client.bankAccounts?.length).toBeGreaterThan(0);
      mock({ client });

      await handler.execute(
        new InitiateDebitRegularTransferCommand(
          new InitiateDebitRegularTransferRequest({
            clientId: client.id,
            amount: Big(200),
            bankAccountId: client.bankAccounts![0].id,
          }),
        ),
      );

      const createBatchSpy = jest.spyOn(transferAPI, 'createAchBatch');
      expect(createBatchSpy).toBeCalledTimes(1);
    });
  });
});
