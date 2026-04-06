import { mockMikroORMProvider, mockToken } from '@core/test';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientApi } from '../../../../api';
import { MarkBankAccountAsPrimaryCommand } from '../../mark-bank-account-as-primary.command';
import { MarkBankAccountAsPrimaryCommandHandler } from './mark-bank-account-as-primary.command-handler';

describe('MarkBankAccountAsPrimaryCommandHandler', () => {
  let clientApi: ClientApi;
  let handler: MarkBankAccountAsPrimaryCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [mockMikroORMProvider, MarkBankAccountAsPrimaryCommandHandler],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    handler = module.get(MarkBankAccountAsPrimaryCommandHandler);
    clientApi = module.get(ClientApi);
  });

  it('should mark bank account as primary', async () => {
    const clientId = 'client-123';
    const bankAccountId = 'ba-456';
    const markedAsPrimary = { id: bankAccountId, isPrimary: true } as any;

    (clientApi.markBankAccountAsPrimary as jest.Mock).mockResolvedValueOnce(
      markedAsPrimary,
    );

    const request = {} as any;
    const cmd = new MarkBankAccountAsPrimaryCommand(
      clientId,
      bankAccountId,
      request,
    );

    const result = await handler.execute(cmd);

    expect(clientApi.markBankAccountAsPrimary).toHaveBeenCalledTimes(1);
    expect(clientApi.markBankAccountAsPrimary).toHaveBeenCalledWith(
      clientId,
      bankAccountId,
    );
    expect(result).toBe(markedAsPrimary);
  });
});
