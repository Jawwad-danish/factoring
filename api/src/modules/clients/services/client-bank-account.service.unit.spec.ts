import { mockMikroORMProvider, mockToken } from '@core/test';
import {
  ClientBankAccountStatus,
  ProductName,
} from '@fs-bobtail/factoring/data';
import { CommandRunner } from '@module-cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientApi } from '../api';
import {
  buildStubBankAccountProduct,
  buildStubClientBankAccount,
} from '../test';
import { ClientBankAccountService } from './client-bank-account.service';
import { MarkBankAccountAsPrimaryCommand } from './commands';
import { ClientBankAccountMissingError } from './errors';

describe('ClientBankAccountService', () => {
  let clientBankAccountService: ClientBankAccountService;
  let clientApi: ClientApi;
  let commandRunner: CommandRunner;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [mockMikroORMProvider, ClientBankAccountService],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    clientBankAccountService = module.get(ClientBankAccountService);
    clientApi = module.get(ClientApi);
    commandRunner = module.get(CommandRunner);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(clientBankAccountService).toBeDefined();
    expect(clientApi).toBeDefined();
  });

  it('should throw error if the bank account is not found', async () => {
    jest.spyOn(clientApi, 'findBankAccountById').mockResolvedValueOnce(null);

    await expect(
      clientBankAccountService.getBankAccountById('1', '1'),
    ).rejects.toThrow(ClientBankAccountMissingError);
  });

  it('should throw error if the bank account is found but is not primary', async () => {
    jest.spyOn(clientApi, 'findBankAccountById').mockResolvedValueOnce(
      buildStubClientBankAccount({
        status: ClientBankAccountStatus.Inactive,
      }),
    );

    await expect(
      clientBankAccountService.getBankAccountById('1', '1', {
        primary: true,
      }),
    ).rejects.toThrow(ClientBankAccountMissingError);
  });

  it('should throw error if the bank account is found but is not expected product', async () => {
    jest.spyOn(clientApi, 'findBankAccountById').mockResolvedValueOnce(
      buildStubClientBankAccount({
        products: [
          buildStubBankAccountProduct({
            name: ProductName.Card,
          }),
        ],
      }),
    );

    await expect(
      clientBankAccountService.getBankAccountById('1', '1', {
        product: ProductName.Factoring,
      }),
    ).rejects.toThrow(ClientBankAccountMissingError);
  });

  it(`should return bank account if primary and for ${ProductName.Factoring} product`, async () => {
    const bankAccountId = 'id';
    jest.spyOn(clientApi, 'findBankAccountById').mockResolvedValueOnce(
      buildStubClientBankAccount({
        id: bankAccountId,
        status: ClientBankAccountStatus.Active,
        products: [
          buildStubBankAccountProduct({
            name: ProductName.Factoring,
          }),
        ],
      }),
    );

    const bankAccount =
      await clientBankAccountService.getPrimaryFactoringBankAccountById(
        '1',
        bankAccountId,
      );
    expect(bankAccount).not.toBeNull();
    expect(bankAccount.id).toBe('id');
  });

  it('should mark bank account as primary', async () => {
    const clientId = 'client-123';
    const bankAccountId = 'ba-456';
    const markedAsPrimary = buildStubClientBankAccount({
      id: bankAccountId,
      status: ClientBankAccountStatus.Active,
    });

    jest.spyOn(commandRunner, 'run').mockResolvedValueOnce(markedAsPrimary);

    const request = {};

    const result = await clientBankAccountService.markBankAccountAsPrimary(
      clientId,
      bankAccountId,
      request,
    );

    expect(commandRunner.run).toHaveBeenCalledTimes(1);
    const calledCommand = (commandRunner.run as jest.Mock).mock.calls[0][0];
    expect(calledCommand).toBeInstanceOf(MarkBankAccountAsPrimaryCommand);
    expect(calledCommand.clientId).toBe(clientId);
    expect(calledCommand.bankAccountId).toBe(bankAccountId);
    expect(calledCommand.request).toBe(request);
    expect(result).toBe(markedAsPrimary);
  });
});
