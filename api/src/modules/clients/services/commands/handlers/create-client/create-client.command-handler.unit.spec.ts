import { mockMikroORMProvider, mockToken } from '@core/test';
import {
  ClientFactoringConfigsRepository,
  UserRepository,
} from '@module-persistence/repositories';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientApi } from '../../../../api';
import { ClientMapper, CreateClientRequest } from '../../../../data';
import { CreateClientCommand } from '../../create-client.command';
import { CreateClientCommandHandler } from './create-client.command-handler';

describe('CreateClientCommandHandler', () => {
  let clientApi: ClientApi;
  let clientFactoringConfigsRepository: ClientFactoringConfigsRepository;
  let userRepository: UserRepository;
  let clientMapper: ClientMapper;
  let handler: CreateClientCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [mockMikroORMProvider, CreateClientCommandHandler],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    clientApi = module.get(ClientApi);
    clientMapper = module.get(ClientMapper);
    clientFactoringConfigsRepository = module.get(
      ClientFactoringConfigsRepository,
    );
    userRepository = module.get(UserRepository);
    handler = module.get(CreateClientCommandHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it.only('updates client factoring config and calls client service api', async () => {
    jest.spyOn(clientMapper, 'buildConfigFromRequest').mockResolvedValueOnce({
      user: EntityStubs.buildUser(),
      clientConfig: EntityStubs.buildClientFactoringConfig(),
    });

    const userPersistAndFlushSpy = jest.spyOn(
      userRepository,
      'persistAndFlush',
    );
    const clientPersistAndFlushSpy = jest.spyOn(
      clientFactoringConfigsRepository,
      'persistAndFlush',
    );
    const clientApiCreateSpy = jest.spyOn(clientApi, 'create');

    await handler.execute(new CreateClientCommand(new CreateClientRequest()));

    expect(userPersistAndFlushSpy).toBeCalledTimes(1);
    expect(clientPersistAndFlushSpy).toBeCalledTimes(1);
    expect(clientApiCreateSpy).toBeCalledTimes(1);
  });
});
