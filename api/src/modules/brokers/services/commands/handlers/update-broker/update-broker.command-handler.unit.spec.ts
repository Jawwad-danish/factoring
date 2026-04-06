import { mockMikroORMProvider, mockToken } from '@core/test';
import { CommandRunner } from '@module-cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { BrokerApi } from '../../../../api';
import { UpdateBrokerRequest } from '../../../../data';
import { UpdateBrokerCommand } from '../../update-broker.command';
import { UpdateBrokerCommandHandler } from './update-broker.command-handler';

describe('UpdateBrokerCommandHandler', () => {
  let brokerApi: BrokerApi;
  let commandRunner: CommandRunner;
  let handler: UpdateBrokerCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [mockMikroORMProvider, UpdateBrokerCommandHandler],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    brokerApi = module.get(BrokerApi);
    commandRunner = module.get(CommandRunner);
    handler = module.get(UpdateBrokerCommandHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('updates broker factoring config and calls update broker service api', async () => {
    const runSpy = jest.spyOn(commandRunner, 'run');
    const brokerApiUpdateSpy = jest.spyOn(brokerApi, 'update');

    await handler.execute(
      new UpdateBrokerCommand('', new UpdateBrokerRequest()),
    );

    expect(runSpy).toBeCalledTimes(1);
    expect(brokerApiUpdateSpy).toBeCalledTimes(1);
  });
});
