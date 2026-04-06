import { mockMikroORMProvider, mockToken } from '@core/test';
import { ClientService } from '@module-clients';
import { buildStubClient } from '@module-clients/test';
import { CommandRunner } from '@module-cqrs';
import { ClientBrokerAssignmentStatus } from '@module-persistence/entities';
import { ClientBrokerAssignmentRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityStubs } from '@module-persistence/test';
import { buildReleaseClientBrokerAssignmentCommand } from '../../../test';
import { ReleaseClientBrokerAssignmentHandler } from './release-client-broker-assignment.handler';
import { ReleaseValidationService } from './validation';
import { GenerateReleaseLetterResult } from '@module-document-generation';

describe('Release client broker assignment handler', () => {
  let handler: ReleaseClientBrokerAssignmentHandler;
  let clientService: ClientService;
  let repository: ClientBrokerAssignmentRepository;
  let commandRunner: CommandRunner;
  let validationService: ReleaseValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [mockMikroORMProvider, ReleaseClientBrokerAssignmentHandler],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    handler = module.get(ReleaseClientBrokerAssignmentHandler);
    clientService = module.get(ClientService);
    repository = module.get(ClientBrokerAssignmentRepository);
    commandRunner = module.get(CommandRunner);
    validationService = module.get(ReleaseValidationService);
  });

  it('Handler should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('Assignment is validated', async () => {
    const client = buildStubClient();
    jest.spyOn(clientService, 'getOneById').mockResolvedValueOnce(client);
    jest
      .spyOn(repository, 'getOne')
      .mockResolvedValueOnce(EntityStubs.buildClientBrokerAssignment());
    jest
      .spyOn(commandRunner, 'run')
      .mockResolvedValueOnce(new GenerateReleaseLetterResult('', ''));
    const validationSpy = jest.spyOn(validationService, 'validate');

    await handler.execute(buildReleaseClientBrokerAssignmentCommand());

    expect(validationSpy).toBeCalledTimes(1);
  });

  it.skip('Command is sent and status is released', async () => {
    const client = buildStubClient();
    jest.spyOn(clientService, 'getOneById').mockResolvedValueOnce(client);
    jest
      .spyOn(repository, 'getOne')
      .mockResolvedValueOnce(EntityStubs.buildClientBrokerAssignment());
    jest
      .spyOn(commandRunner, 'run')
      .mockResolvedValueOnce(new GenerateReleaseLetterResult('', ''));
    const commandSpy = jest.spyOn(commandRunner, 'run');

    const result = await handler.execute(
      buildReleaseClientBrokerAssignmentCommand(),
    );

    expect(commandSpy).toBeCalledTimes(1);
    expect(result.status).toBe(ClientBrokerAssignmentStatus.Released);
  });
});
