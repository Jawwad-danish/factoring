import { mockMikroORMProvider, mockToken } from '@core/test';
import { BrokerService } from '@module-brokers';
import { buildStubBroker } from '@module-brokers/test';
import { ClientService } from '@module-clients';
import { buildStubClient } from '@module-clients/test';
import {
  ClientBrokerAssignmentStatus,
  TagDefinitionKey,
} from '@module-persistence/entities';
import { ClientBrokerAssignmentRepository } from '@module-persistence/repositories';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import { buildStubCreateBrokerPaymentRequest } from '../../../../../test';
import { CreateBrokerPaymentUpdateAssignmentRule } from './create-broker-payment-update-assignment-rule';

describe('CreateBrokerPaymentUpdateAssignmentRule', () => {
  let rule: CreateBrokerPaymentUpdateAssignmentRule;
  let repository: ClientBrokerAssignmentRepository;
  let clientService: ClientService;
  let brokerService: BrokerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        mockMikroORMProvider,
        CreateBrokerPaymentUpdateAssignmentRule,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    rule = module.get(CreateBrokerPaymentUpdateAssignmentRule);
    repository = module.get<ClientBrokerAssignmentRepository>(
      ClientBrokerAssignmentRepository,
    );
    clientService = module.get(ClientService);
    brokerService = module.get(BrokerService);
  });

  it('Rule should be defined', () => {
    expect(rule).toBeDefined();
  });

  it('When no broker is set then the assignment is not updated', async () => {
    const result = await rule.run({
      brokerPayment: EntityStubs.buildStubBrokerPayment(),
      invoice: EntityStubs.buildStubInvoice({
        brokerId: null,
      }),
      request: buildStubCreateBrokerPaymentRequest(),
    });
    expect(result.isEmpty()).toBeTruthy();
  });

  it('When non payment then the assignment is not updated', async () => {
    const result = await rule.run({
      brokerPayment: EntityStubs.buildStubBrokerPayment({
        amount: new Big(0),
      }),
      invoice: EntityStubs.buildStubInvoice(),
      request: buildStubCreateBrokerPaymentRequest(),
    });
    expect(result.isEmpty()).toBeTruthy();
  });

  it('When no assignment is found then the assignment is not updated', async () => {
    jest.spyOn(repository, 'findOne').mockResolvedValue(null);

    const result = await rule.run({
      brokerPayment: EntityStubs.buildStubBrokerPayment(),
      invoice: EntityStubs.buildStubInvoice(),
      request: buildStubCreateBrokerPaymentRequest(),
    });
    expect(result.isEmpty()).toBeTruthy();
  });

  it('When assignment is verified then the assignment is not updated', async () => {
    jest.spyOn(repository, 'findOne').mockResolvedValue(
      EntityStubs.createClientBrokerAssignment({
        status: ClientBrokerAssignmentStatus.Verified,
      }),
    );

    const result = await rule.run({
      brokerPayment: EntityStubs.buildStubBrokerPayment(),
      invoice: EntityStubs.buildStubInvoice(),
      request: buildStubCreateBrokerPaymentRequest(),
    });
    expect(result.isEmpty()).toBeTruthy();
  });

  it('When assignment is not verified then the assignment is updated', async () => {
    const assignment = EntityStubs.createClientBrokerAssignment({
      status: ClientBrokerAssignmentStatus.Sent,
    });
    jest.spyOn(repository, 'findOne').mockResolvedValue(assignment);
    jest
      .spyOn(clientService, 'getOneById')
      .mockResolvedValue(buildStubClient());
    jest
      .spyOn(brokerService, 'findOneById')
      .mockResolvedValue(buildStubBroker());

    const result = await rule.run({
      brokerPayment: EntityStubs.buildStubBrokerPayment(),
      invoice: EntityStubs.buildStubInvoice(),
      request: buildStubCreateBrokerPaymentRequest(),
    });
    expect(result.isEmpty()).toBeFalsy();
    expect(result.actions[0].key).toBe(
      TagDefinitionKey.UPDATE_CLIENT_BROKER_ASSIGNMENT,
    );
    expect(assignment.status).toBe(ClientBrokerAssignmentStatus.Verified);
  });
});
