import { mockMikroORMProvider, mockToken } from '@core/test';
import { buildStubBroker } from '@module-brokers/test';
import { buildStubClient } from '@module-clients/test';
import {
  ClientBrokerAssignmentStatus,
  TagDefinitionKey,
} from '@module-persistence/entities';
import { ClientBrokerAssignmentRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import { randomInt } from 'crypto';
import { ClientBrokerAssignmentRule } from './client-broker-assignment-rule';
import { EventPublisher } from '@module-cqrs';
import { EmailEvents } from '@common';
import { EntityStubs } from '@module-persistence/test';

describe('ClientBrokerAssignmentRule', () => {
  let rule: ClientBrokerAssignmentRule;
  let clientBrokerAssignmentRepository: ClientBrokerAssignmentRepository;
  let eventPublisher: EventPublisher;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [mockMikroORMProvider, ClientBrokerAssignmentRule],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    rule = module.get(ClientBrokerAssignmentRule);
    clientBrokerAssignmentRepository =
      module.get<ClientBrokerAssignmentRepository>(
        ClientBrokerAssignmentRepository,
      );
    eventPublisher = module.get<EventPublisher>(EventPublisher);
  }, 60000);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Client Broker Assignment Rule should be defined', () => {
    expect(rule).toBeDefined();
  });

  it('If not broker, returns empty array', async () => {
    const result = await rule.run({
      entity: EntityStubs.buildStubInvoice(),
      client: buildStubClient(),
      broker: null,
      payload: { deduction: Big(randomInt(1000)) },
    });
    expect(result.actions).toStrictEqual([]);
  });

  it('If broker is null, email should not be sent', async () => {
    const eventHandlerSpy = jest.spyOn(eventPublisher, 'emit');
    await rule.run({
      entity: EntityStubs.buildStubInvoice(),
      client: buildStubClient(),
      broker: null,
      payload: { deduction: Big(randomInt(1000)) },
    });
    expect(eventHandlerSpy).toBeCalledTimes(0);
  });

  it('Email is sent if assignment is found and status is released', async () => {
    const eventHandlerSpy = jest.spyOn(eventPublisher, 'emit');
    jest.spyOn(clientBrokerAssignmentRepository, 'findOne').mockResolvedValue(
      EntityStubs.buildClientBrokerAssignment({
        status: ClientBrokerAssignmentStatus.Released,
      }),
    );
    await rule.run({
      entity: EntityStubs.buildStubInvoice(),
      client: buildStubClient(),
      broker: buildStubBroker(),
      payload: { deduction: Big(randomInt(1000)) },
    });
    expect(eventHandlerSpy).toBeCalledTimes(1);
    expect(eventHandlerSpy).toBeCalledWith(EmailEvents.Noa, expect.anything());
  });

  it('Email is not sent if assignment is found and status is Sent', async () => {
    const eventHandlerSpy = jest.spyOn(eventPublisher, 'emit');
    jest.spyOn(clientBrokerAssignmentRepository, 'findOne').mockResolvedValue(
      EntityStubs.buildClientBrokerAssignment({
        status: ClientBrokerAssignmentStatus.Sent,
      }),
    );
    await rule.run({
      entity: EntityStubs.buildStubInvoice(),
      client: buildStubClient(),
      broker: buildStubBroker(),
      payload: { deduction: Big(randomInt(1000)) },
    });
    expect(eventHandlerSpy).toBeCalledTimes(0);
  });

  it('Email is sent if assignment is not found', async () => {
    const eventHandlerSpy = jest.spyOn(eventPublisher, 'emit');
    jest
      .spyOn(clientBrokerAssignmentRepository, 'findOne')
      .mockResolvedValue(null);
    await rule.run({
      entity: EntityStubs.buildStubInvoice(),
      client: buildStubClient(),
      broker: buildStubBroker(),
      payload: { deduction: Big(randomInt(1000)) },
    });
    expect(eventHandlerSpy).toBeCalledTimes(1);
    expect(eventHandlerSpy).toBeCalledWith(EmailEvents.Noa, expect.anything());
  });

  it('Create client broker assignment and returns tag activity', async () => {
    jest
      .spyOn(clientBrokerAssignmentRepository, 'findOne')
      .mockResolvedValue(null);
    const persistSpy = jest
      .spyOn(clientBrokerAssignmentRepository, 'persist')
      .mockImplementation();
    const result = await rule.run({
      entity: EntityStubs.buildStubInvoice(),
      client: buildStubClient(),
      broker: buildStubBroker(),
      payload: { deduction: Big(randomInt(1000)) },
    });

    expect(result.actions[0].key).toBe(
      TagDefinitionKey.CREATE_CLIENT_BROKER_ASSIGNMENT,
    );
    expect(result.actions[0].noteDetails).not.toBeNull();
    expect(persistSpy).toBeCalledTimes(1);
  });

  it('Update client broker assignment and returns tag activity', async () => {
    jest.spyOn(clientBrokerAssignmentRepository, 'findOne').mockResolvedValue(
      EntityStubs.buildClientBrokerAssignment({
        status: ClientBrokerAssignmentStatus.Released,
      }),
    );
    const result = await rule.run({
      entity: EntityStubs.buildStubInvoice(),
      client: buildStubClient(),
      broker: buildStubBroker(),
      payload: { deduction: Big(randomInt(1000)) },
    });

    expect(result.actions[0].key).toBe(
      TagDefinitionKey.UPDATE_CLIENT_BROKER_ASSIGNMENT,
    );
    expect(result.actions[0].noteDetails).not.toBeNull();
  });
});
