import { mockMikroORMProvider, mockToken } from '@core/test';
import { ProductName } from '@fs-bobtail/factoring/data';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientApi } from '../../../../api';
import { CreateClientBankAccountCommand } from '../../create-client-bank-account.command';
import { CreateClientBankAccountCommandHandler } from './create-client-bank-account.command-handler';

describe('CreateClientBankAccountCommandHandler', () => {
  let clientApi: ClientApi;
  let handler: CreateClientBankAccountCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [mockMikroORMProvider, CreateClientBankAccountCommandHandler],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    handler = module.get(CreateClientBankAccountCommandHandler);
    clientApi = module.get(ClientApi);
  });

  it('should create client bank account', async () => {
    const client = { id: 'client-123', name: 'Acme Trucking' } as any;
    (clientApi.getById as jest.Mock).mockResolvedValueOnce(client);

    const created = { id: 'ba-1', name: 'Main Checking' } as any;
    (clientApi.createBankAccount as jest.Mock).mockResolvedValueOnce(created);

    const cmd = new CreateClientBankAccountCommand({
      product: ProductName.Factoring,
      clientId: client.id,
      plaidAccount: {
        bankName: 'Bank A',
        bankAccountName: 'Checking',
        linkSessionId: 'ls-1',
        publicToken: 'pub-1',
        accountId: 'acc-1',
      },
    } as any);

    const result = await handler.execute(cmd);

    expect(clientApi.getById).toHaveBeenCalledTimes(1);
    expect(clientApi.getById).toHaveBeenCalledWith(client.id);

    expect(clientApi.createBankAccount).toHaveBeenCalledTimes(1);
    const [passedClientId, passedRequest] = (
      clientApi.createBankAccount as jest.Mock
    ).mock.calls[0];
    expect(passedClientId).toBe(client.id);
    expect(passedRequest.clientId).toBe(client.id);
    expect(passedRequest.createdBy).toBe(client.id);

    expect(result).toBe(created);
  });
});
