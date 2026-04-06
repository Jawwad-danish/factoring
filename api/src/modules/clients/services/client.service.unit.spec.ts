import { FilterOperator } from '@core/data';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { UUID } from '@core/uuid';
import {
  BankAccountIssues,
  ClientBankAccountStatus,
  SupportedPaymentMethod,
} from '@fs-bobtail/factoring/data';
import { createMock } from '@golevelup/ts-jest';
import {
  buildStubClient,
  buildStubClientBankAccount,
  buildStubModernTreasuryAccount,
  buildStubPlaidAccount,
} from '@module-clients/test';
import { QueryRunner } from '@module-cqrs';
import { ClientFactoringConfigsRepository } from '@module-persistence/repositories';
import { EntityStubs } from '@module-persistence/test';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientApi } from '../api';
import { ClientDocumentType } from '../data/client-document.model';
import { ClientFactoringConfigMapper } from '../data/mappers';
import { ClientService } from './client.service';

describe('ClientService', () => {
  let clientService: ClientService;
  let clientApi: ClientApi;
  const queryRunnerMock = createMock<QueryRunner>();
  const clientFactoringConfigRepository =
    createMock<ClientFactoringConfigsRepository>();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        mockMikroORMProvider,
        ClientService,
        ClientFactoringConfigMapper,
        {
          provide: ClientFactoringConfigsRepository,
          useValue: clientFactoringConfigRepository,
        },
        {
          provide: QueryRunner,
          useValue: queryRunnerMock,
        },
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    clientService = module.get(ClientService);
    clientApi = module.get(ClientApi);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(clientService).toBeDefined();
    expect(clientApi).toBeDefined();
    expect(clientFactoringConfigRepository).toBeDefined();
  });

  it('Client bank accounts are fetched if the option is turned on', async () => {
    const id = UUID.get();
    const clientFactoringConfig = EntityStubs.buildClientFactoringConfig({
      clientId: id,
    });
    clientFactoringConfigRepository.findByClientIds.mockResolvedValueOnce([
      clientFactoringConfig,
    ]);
    jest
      .spyOn(clientApi, 'getById')
      .mockResolvedValueOnce(buildStubClient({ id: id }));

    jest
      .spyOn(clientApi, 'getBankAccountsByClientId')
      .mockResolvedValueOnce([buildStubClientBankAccount()]);

    const client = await clientService.getOneById(id, {
      includeBankAccounts: true,
    });

    expect(client.bankAccounts).toBeDefined();
  });

  it('fetches factoring bank accounts by client id', async () => {
    const id = UUID.get();
    const bankAccounts = [buildStubClientBankAccount()];

    jest
      .spyOn(clientApi, 'getBankAccountsByClientId')
      .mockResolvedValueOnce(bankAccounts);

    queryRunnerMock.run.mockResolvedValueOnce([]);

    const result = await clientService.getFactoringBankAccounts(id);

    expect(clientApi.getBankAccountsByClientId).toHaveBeenCalledWith(
      id,
      undefined,
      true,
    );
    expect(result).toHaveLength(1);
    expect(result[0].supportedPaymentMethods).toEqual([
      SupportedPaymentMethod.Ach,
      SupportedPaymentMethod.Wire,
    ]);
  });

  it('returns computed bank account issues for factoring bank accounts', async () => {
    const id = UUID.get();
    const bankAccounts = [
      buildStubClientBankAccount({
        wireRoutingNumber: undefined,
        plaidAccount: buildStubPlaidAccount({
          verificationStatus: 'pending_automatic_verification',
          bankName: undefined,
        }),
        modernTreasuryAccount: buildStubModernTreasuryAccount({
          confirmedWire: false,
          wireRoutingNumber: undefined,
        }),
      }),
    ];

    jest
      .spyOn(clientApi, 'getBankAccountsByClientId')
      .mockResolvedValueOnce(bankAccounts);

    queryRunnerMock.run.mockResolvedValueOnce([]);

    const result = await clientService.getFactoringBankAccounts(id);

    expect(result[0].issues).toEqual([
      BankAccountIssues.PendingVerification,
      BankAccountIssues.RequiresWireRoutingNumber,
      BankAccountIssues.MissingBankName,
    ]);
  });

  it('empty array is returned when no bank accounts are found', async () => {
    const id = UUID.get();

    jest
      .spyOn(clientApi, 'getBankAccountsByClientId')
      .mockResolvedValueOnce([]);

    const result = await clientService.getFactoringBankAccounts(id);

    expect(clientApi.getBankAccountsByClientId).toHaveBeenCalledWith(
      id,
      undefined,
      true,
    );
    expect(result).toEqual([]);
  });

  it('should call getBankAccountsByClientId with shouldMask=false when includeSensitive is true', async () => {
    const id = UUID.get();
    const bankAccounts = [buildStubClientBankAccount()];

    jest
      .spyOn(clientApi, 'getBankAccountsByClientId')
      .mockResolvedValueOnce(bankAccounts);

    queryRunnerMock.run.mockResolvedValueOnce([]);

    await clientService.getFactoringBankAccounts(id, {
      includeSensitive: true,
    });

    expect(clientApi.getBankAccountsByClientId).toHaveBeenCalledWith(
      id,
      undefined,
      false,
    );
  });

  it('should call getBankAccountsByClientId with shouldMask=true when includeSensitive is false', async () => {
    const id = UUID.get();
    const bankAccounts = [buildStubClientBankAccount()];

    jest
      .spyOn(clientApi, 'getBankAccountsByClientId')
      .mockResolvedValueOnce(bankAccounts);

    queryRunnerMock.run.mockResolvedValueOnce([]);

    await clientService.getFactoringBankAccounts(id, {
      includeSensitive: false,
    });

    expect(clientApi.getBankAccountsByClientId).toHaveBeenCalledWith(
      id,
      undefined,
      true,
    );
  });

  it('Active bank account filter is used when fetching the primary bank account', async () => {
    const id = UUID.get();
    const clientFactoringConfig = EntityStubs.buildClientFactoringConfig({
      clientId: id,
    });
    clientFactoringConfigRepository.findByClientIds.mockResolvedValueOnce([
      clientFactoringConfig,
    ]);

    const spy = jest
      .spyOn(clientApi, 'getBankAccountsByClientId')
      .mockResolvedValueOnce([buildStubClientBankAccount()]);

    await clientService.getPrimaryBankAccount(id);

    expect(spy.mock.calls[0][1]).toBeDefined();
    expect(spy.mock.calls[0][1]?.filters).toBeDefined();
    expect(spy.mock.calls[0][1]?.filters?.[0]).toMatchObject({
      name: 'status',
      operator: FilterOperator.EQ,
      value: ClientBankAccountStatus.Active,
    });
  });

  it('should call commandRunner.run with UpdateClientDocumentCommand and return result', async () => {
    const clientId = 'client-id';
    const documentId = 'doc-id';
    const request = {
      id: documentId,
      internalUrl: 'int',
      externalUrl: 'ext',
      type: ClientDocumentType.MC_AUTHORITY,
      updatedBy: 'updatedBy',
    };
    const expectedResult = { ...request };

    const runSpy = jest
      .spyOn(clientService['commandRunner'], 'run')
      .mockResolvedValueOnce(expectedResult);

    const result = await clientService.updateClientDocument(
      clientId,
      documentId,
      request,
    );

    expect(runSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId,
        documentId,
        request,
      }),
    );
    expect(result).toBe(expectedResult);
  });

  describe('getPrimaryBankAccount', () => {
    it('should return first valid bank account', async () => {
      const clientId = UUID.get();

      const bankAccountWithoutWire = buildStubClientBankAccount({
        modernTreasuryAccount: { confirmedWire: false },
        status: ClientBankAccountStatus.Active,
      });
      const bankAccountWithWire = buildStubClientBankAccount({
        modernTreasuryAccount: { confirmedWire: true },
        status: ClientBankAccountStatus.Active,
      });

      jest
        .spyOn(clientApi, 'getBankAccountsByClientId')
        .mockResolvedValueOnce([bankAccountWithoutWire, bankAccountWithWire]);

      const result = await clientService.getPrimaryBankAccount(clientId);

      expect(result).toBe(bankAccountWithoutWire);
    });
  });

  describe('sendResetClientPasswordRequest', () => {
    it('should send password reset email for client user', async () => {
      const mockUser = EntityStubs.buildUser();
      const mockClientConfig = EntityStubs.buildClientFactoringConfig();
      mockClientConfig.user = mockUser;
      const clientId = mockClientConfig.clientId;

      jest
        .spyOn(
          clientService['clientFactoringConfigRepository'],
          'getOneByClientId',
        )
        .mockResolvedValue(mockClientConfig);
      const validateUserIsNotEmployee = jest
        .spyOn(clientService['userService'], 'validateUserIsNotEmployee')
        .mockResolvedValue(undefined);
      const sendResetPasswordRequest = jest
        .spyOn(clientService['userService'], 'sendResetPasswordRequest')
        .mockResolvedValue(undefined);

      await clientService.sendResetClientPasswordRequest(clientId);

      expect(
        clientService['clientFactoringConfigRepository'].getOneByClientId,
      ).toHaveBeenCalledWith(clientId);
      expect(validateUserIsNotEmployee).toHaveBeenCalledWith(mockUser.id);
      expect(sendResetPasswordRequest).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw error if client config is not found', async () => {
      const clientId = 'non-existent-client-id';

      jest
        .spyOn(
          clientService['clientFactoringConfigRepository'],
          'getOneByClientId',
        )
        .mockRejectedValue(new Error('Client config not found'));

      await expect(
        clientService.sendResetClientPasswordRequest(clientId),
      ).rejects.toThrow('Client config not found');
    });

    it('should throw error if user is an employee', async () => {
      const mockUser = EntityStubs.buildUser();
      const mockClientConfig = EntityStubs.buildClientFactoringConfig();
      mockClientConfig.user = mockUser;
      const clientId = mockClientConfig.clientId;

      jest
        .spyOn(
          clientService['clientFactoringConfigRepository'],
          'getOneByClientId',
        )
        .mockResolvedValue(mockClientConfig);
      jest
        .spyOn(clientService['userService'], 'validateUserIsNotEmployee')
        .mockRejectedValue(new BadRequestException('User is an employee'));

      await expect(
        clientService.sendResetClientPasswordRequest(clientId),
      ).rejects.toThrow('User is an employee');
    });
  });
});
