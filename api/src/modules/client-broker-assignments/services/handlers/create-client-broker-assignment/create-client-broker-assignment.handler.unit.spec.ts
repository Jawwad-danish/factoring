import { mockToken } from '@core/test';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import {
  ClientBrokerAssignmentRepository,
  ClientBrokerAssignmentStatus,
} from '@module-persistence';
import { Test, TestingModule } from '@nestjs/testing';
import { buildCreateClientBrokerAssignmentCommand } from '../../../test';
import { CreateClientBrokerAssignmentHandler } from './create-client-broker-assignment.handler';

jest.mock('@module-persistence', () => {
  const actual = jest.requireActual('@module-persistence');
  return {
    ...actual,
    ClientBrokerAssignmentEntity: jest.fn(function () {
      this.clientId = undefined;
      this.brokerId = undefined;
      this.status = undefined;
      this.assignmentHistory = { add: jest.fn() };
    }),
    ClientBrokerAssignmentAssocEntity: jest.fn(function () {
      this.status = undefined;
    }),
  };
});

describe('CreateClientBrokerAssignmentHandler', () => {
  let handler: CreateClientBrokerAssignmentHandler;
  let repository: DeepMocked<ClientBrokerAssignmentRepository>;

  beforeEach(async () => {
    repository = createMock<ClientBrokerAssignmentRepository>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateClientBrokerAssignmentHandler,
        ClientBrokerAssignmentRepository,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .overrideProvider(ClientBrokerAssignmentRepository)
      .useValue(repository)
      .compile();

    handler = module.get<CreateClientBrokerAssignmentHandler>(
      CreateClientBrokerAssignmentHandler,
    );

    repository.persistAndFlush.mockImplementation((entity: any) => {
      return Promise.resolve(entity);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Handler should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('Should call persistAndFlush with entity containing clientId, brokerId, and status', async () => {
    const command = buildCreateClientBrokerAssignmentCommand({
      status: ClientBrokerAssignmentStatus.Sent,
    });

    await handler.execute(command);

    expect(repository.persistAndFlush).toHaveBeenCalled();
    const persistedEntity = (repository.persistAndFlush as jest.Mock).mock
      .calls[0][0];
    expect(persistedEntity.clientId).toBeDefined();
    expect(persistedEntity.brokerId).toBeDefined();
    expect(persistedEntity.status).toBe(ClientBrokerAssignmentStatus.Sent);
  });

  it('Should return entity with correct properties', async () => {
    const command = buildCreateClientBrokerAssignmentCommand({
      status: ClientBrokerAssignmentStatus.Verified,
    });

    const result = await handler.execute(command);

    expect(result).toBeDefined();
    expect(result.clientId).toBeDefined();
    expect(result.brokerId).toBeDefined();
    expect(result.status).toBe(ClientBrokerAssignmentStatus.Verified);
  });

  it('Should handle different assignment statuses', async () => {
    const command = buildCreateClientBrokerAssignmentCommand({
      status: ClientBrokerAssignmentStatus.Released,
    });

    const result = await handler.execute(command);

    expect(result.status).toBe(ClientBrokerAssignmentStatus.Released);
    expect(repository.persistAndFlush).toHaveBeenCalled();
  });
});
