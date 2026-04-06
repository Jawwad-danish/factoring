import { mockMikroORMProvider, mockToken } from '@core/test';
import { CommandRunner } from '@module-cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientApi } from '../../../../api';
import { UpdateClientRequest } from '../../../../data';
import { UpdateClientCommand } from '../../update-client.command';
import { UpdateClientCommandHandler } from './update-client.command-handler';

describe('UpdateClientCommandHandler', () => {
  let clientApi: ClientApi;
  let commandRunner: CommandRunner;
  let handler: UpdateClientCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [mockMikroORMProvider, UpdateClientCommandHandler],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    clientApi = module.get(ClientApi);
    commandRunner = module.get(CommandRunner);
    handler = module.get(UpdateClientCommandHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('updates client factoring config and calls client service api', async () => {
    const runSpy = jest.spyOn(commandRunner, 'run');
    const clientApiUpdateSpy = jest.spyOn(clientApi, 'update');

    await handler.execute(
      new UpdateClientCommand('', new UpdateClientRequest()),
    );

    expect(runSpy).toBeCalledTimes(1);
    expect(clientApiUpdateSpy).toBeCalledTimes(1);
  });
});
