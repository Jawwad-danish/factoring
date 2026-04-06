import { mockMikroORMProvider, mockToken } from '@core/test';
import { buildStubCreateBrokerPaymentRequest } from '@module-broker-payments/test';
import {
  BrokerPaymentRepository,
  ClientBrokerAssignmentRepository,
} from '@module-persistence';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import { DeleteBrokerPaymentUpdateAssignmentRule } from './delete-broker-payment-assignment-update-rule';

describe('DeleteBrokerPaymentUpdateAssignmentRule', () => {
  let rule: DeleteBrokerPaymentUpdateAssignmentRule;
  let clientBrokerAssignmentRepository: ClientBrokerAssignmentRepository;
  let brokerPaymentRepository: BrokerPaymentRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        mockMikroORMProvider,
        DeleteBrokerPaymentUpdateAssignmentRule,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    rule = module.get(DeleteBrokerPaymentUpdateAssignmentRule);
    clientBrokerAssignmentRepository = module.get(
      ClientBrokerAssignmentRepository,
    );
    brokerPaymentRepository = module.get(BrokerPaymentRepository);
  }, 60000);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Rule should be defined', () => {
    expect(rule).toBeDefined();
  });

  it('Updates status if there are no payments with amount > 0', async () => {
    jest
      .spyOn(clientBrokerAssignmentRepository, 'getOne')
      .mockReturnValue(
        Promise.resolve(EntityStubs.buildClientBrokerAssignment()),
      );
    jest
      .spyOn(brokerPaymentRepository, 'getAllByClientAndBrokerId')
      .mockReturnValue(
        Promise.resolve([
          EntityStubs.buildStubBrokerPayment({ amount: Big(0) }),
        ]),
      );
    const updateSpy = jest.spyOn(clientBrokerAssignmentRepository, 'getOne');

    await rule.run({
      brokerPayment: EntityStubs.buildStubBrokerPayment(),
      invoice: EntityStubs.buildStubInvoice(),
      request: buildStubCreateBrokerPaymentRequest(),
    });

    expect(updateSpy).toBeCalledTimes(1);
  });

  it('Does not update status if there are payments with amount > 0', async () => {
    jest
      .spyOn(clientBrokerAssignmentRepository, 'getOne')
      .mockReturnValue(
        Promise.resolve(EntityStubs.buildClientBrokerAssignment()),
      );
    jest
      .spyOn(brokerPaymentRepository, 'getAllByClientAndBrokerId')
      .mockReturnValue(
        Promise.resolve([
          EntityStubs.buildStubBrokerPayment({ amount: Big(100) }),
        ]),
      );
    const updateSpy = jest.spyOn(clientBrokerAssignmentRepository, 'getOne');

    await rule.run({
      brokerPayment: EntityStubs.buildStubBrokerPayment(),
      invoice: EntityStubs.buildStubInvoice(),
      request: buildStubCreateBrokerPaymentRequest(),
    });

    expect(updateSpy).toBeCalledTimes(0);
  });
});
