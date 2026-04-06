import { mockToken } from '@core/test';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { BrokerService, BrokerStatsDataAccess } from '@module-brokers';
import { buildStubBroker } from '@module-brokers/test';
import { ClientService } from '@module-clients';
import { buildStubClient } from '@module-clients/test';
import { NoticeOfAssignmentEmail } from '@module-email';
import { EntityStubs } from '@module-persistence/test';
import { ClientBrokerAssignmentRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { SendNoaBombCommand } from '../../commands';
import { SendNoaBombHandler } from './send-noa-bomb.command-handler';
import { ClientBrokerAssignmentStatus } from '@module-persistence/entities';

describe('SendNoaBombHandler', () => {
  let handler: SendNoaBombHandler;
  let clientService: DeepMocked<ClientService>;
  let brokerService: DeepMocked<BrokerService>;
  let brokerStatsDataAccess: DeepMocked<BrokerStatsDataAccess>;
  let repository: DeepMocked<ClientBrokerAssignmentRepository>;
  let noaEmail: DeepMocked<NoticeOfAssignmentEmail>;

  beforeEach(async () => {
    clientService = createMock<ClientService>();
    brokerService = createMock<BrokerService>();
    brokerStatsDataAccess = createMock<BrokerStatsDataAccess>();
    repository = createMock<ClientBrokerAssignmentRepository>();
    noaEmail = createMock<NoticeOfAssignmentEmail>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendNoaBombHandler,
        ClientService,
        BrokerService,
        BrokerStatsDataAccess,
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
      .overrideProvider(BrokerStatsDataAccess)
      .useValue(brokerStatsDataAccess)
      .overrideProvider(ClientBrokerAssignmentRepository)
      .useValue(repository)
      .overrideProvider(NoticeOfAssignmentEmail)
      .useValue(noaEmail)
      .compile();

    handler = module.get<SendNoaBombHandler>(SendNoaBombHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Handler should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('Should send NOA bomb to brokers', async () => {
    const clientId = 'client-id';
    const client = buildStubClient();
    client.id = clientId;

    const broker1 = buildStubBroker({ id: 'broker-1' });
    const broker2 = buildStubBroker({ id: 'broker-2' });
    const broker3 = buildStubBroker({ id: 'broker-3' });

    const assignments = [EntityStubs.buildClientBrokerAssignment()];

    const stats = Array(50).fill(EntityStubs.buildStubBrokerFactoringStats({}));

    clientService.getOneById.mockResolvedValue(client);
    brokerStatsDataAccess.getTopBrokersByAging.mockResolvedValue(stats);
    repository.findAll.mockResolvedValue([assignments, assignments.length]);
    brokerService.findByIds.mockResolvedValue([broker1, broker2, broker3]);
    noaEmail.sendBomb.mockResolvedValue();

    await handler.execute(new SendNoaBombCommand(clientId));

    expect(clientService.getOneById).toHaveBeenCalledWith(clientId);
    expect(brokerStatsDataAccess.getTopBrokersByAging).toHaveBeenCalled();
    expect(repository.findAll).toHaveBeenCalledWith({
      clientId,
      status: ClientBrokerAssignmentStatus.Released,
    });
    expect(brokerService.findByIds).toHaveBeenCalledWith([
      ...new Set([
        ...stats.map((s) => s.brokerId),
        ...assignments.map((a) => a.brokerId),
      ]),
    ]);
    expect(noaEmail.sendBomb).toHaveBeenCalledWith({
      client,
      brokers: [broker1, broker2, broker3],
    });
  });

  it('Should deduplicate broker IDs from different sources', async () => {
    const clientId = 'client-id';
    const client = buildStubClient();

    const topBrokerStats = [
      EntityStubs.buildStubBrokerFactoringStats({ brokerId: 'broker-1' }),
      EntityStubs.buildStubBrokerFactoringStats({ brokerId: 'broker-2' }),
    ];

    const assignments = [
      EntityStubs.buildClientBrokerAssignment({ brokerId: 'broker-2' }),
      EntityStubs.buildClientBrokerAssignment({ brokerId: 'broker-3' }),
    ];

    clientService.getOneById.mockResolvedValue(client);
    brokerStatsDataAccess.getTopBrokersByAging.mockResolvedValue(
      topBrokerStats,
    );
    repository.findAll.mockResolvedValue([assignments, assignments.length]);
    brokerService.findByIds.mockResolvedValue([]);
    noaEmail.sendBomb.mockResolvedValue();

    await handler.execute(new SendNoaBombCommand(clientId));

    expect(brokerService.findByIds).toHaveBeenCalledWith([
      'broker-1',
      'broker-2',
      'broker-3',
    ]);
  });

  it('Should handle empty results from broker stats and assignments', async () => {
    const clientId = 'client-id';
    const client = buildStubClient();

    clientService.getOneById.mockResolvedValue(client);
    brokerStatsDataAccess.getTopBrokersByAging.mockResolvedValue([]);
    repository.findAll.mockResolvedValue([[], 0]);
    brokerService.findByIds.mockResolvedValue([]);
    noaEmail.sendBomb.mockResolvedValue();

    await handler.execute(new SendNoaBombCommand(clientId));

    expect(brokerService.findByIds).toHaveBeenCalledWith([]);
    expect(noaEmail.sendBomb).toHaveBeenCalledWith({ client, brokers: [] });
  });
});
