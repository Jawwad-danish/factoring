import { mockToken } from '@core/test';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { BrokerService } from '@module-brokers';
import { buildStubBroker } from '@module-brokers/test';
import { ClientService } from '@module-clients';
import { buildStubClient } from '@module-clients/test';
import { NoticeOfAssignmentEmail } from '@module-email';
import { ClientBrokerAssignmentRepository } from '@module-persistence/repositories';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import { SendNoaCommand } from '../../commands';
import { SendNoaHandler } from './send-noa.command-handler';

describe('SendNoaHandler', () => {
  let handler: SendNoaHandler;
  let clientService: DeepMocked<ClientService>;
  let brokerService: DeepMocked<BrokerService>;
  let repository: DeepMocked<ClientBrokerAssignmentRepository>;
  let noaEmail: DeepMocked<NoticeOfAssignmentEmail>;

  beforeEach(async () => {
    clientService = createMock<ClientService>();
    brokerService = createMock<BrokerService>();
    repository = createMock<ClientBrokerAssignmentRepository>();
    noaEmail = createMock<NoticeOfAssignmentEmail>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendNoaHandler,
        ClientService,
        BrokerService,
        ClientBrokerAssignmentRepository,
        NoticeOfAssignmentEmail,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .overrideProvider(ClientService)
      .useValue(clientService)
      .overrideProvider(BrokerService)
      .useValue(brokerService)
      .overrideProvider(ClientBrokerAssignmentRepository)
      .useValue(repository)
      .overrideProvider(NoticeOfAssignmentEmail)
      .useValue(noaEmail)
      .compile();

    handler = module.get<SendNoaHandler>(SendNoaHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Handler should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('Should send NOA email', async () => {
    const assignmentId = 'assignment-id';
    const clientId = 'client-id';
    const brokerId = 'broker-id';
    const to = 'debtor@test.com';

    const assignment = EntityStubs.buildClientBrokerAssignment({
      id: assignmentId,
      clientId,
      brokerId,
    });
    const client = buildStubClient();
    client.id = clientId;
    const broker = buildStubBroker({ id: brokerId });

    repository.getOneById.mockResolvedValue(assignment);
    clientService.getOneById.mockResolvedValue(client);
    brokerService.getOneById.mockResolvedValue(broker);
    noaEmail.send.mockResolvedValue(null);

    await handler.execute(new SendNoaCommand({ id: assignmentId, to }));

    expect(repository.getOneById).toHaveBeenCalledWith(assignmentId);
    expect(clientService.getOneById).toHaveBeenCalledWith(clientId);
    expect(brokerService.getOneById).toHaveBeenCalledWith(brokerId);
    expect(noaEmail.send).toHaveBeenCalledWith({ client, broker, to });
  });
});
