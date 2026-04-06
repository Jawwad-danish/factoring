import { totalAmount } from '@core/formulas';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { Repositories } from '@module-persistence/repositories';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import { buildStubCreateBrokerPaymentRequest } from '../../../../../test';
import { CreateBrokerPaymentReserveRule } from './create-broker-payment-reserve-rule';

describe('CreateBrokerPaymentReserveRule', () => {
  let rule: CreateBrokerPaymentReserveRule;
  let repositories: Repositories;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [mockMikroORMProvider, CreateBrokerPaymentReserveRule],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    rule = module.get(CreateBrokerPaymentReserveRule);
    repositories = module.get(Repositories);
  });

  it('should be defined', () => {
    expect(rule).toBeDefined();
  });

  it('should persist a reserve', async () => {
    const invoiceStub = EntityStubs.buildStubInvoice();
    invoiceStub.accountsReceivableValue = totalAmount(invoiceStub);
    await rule.run({
      brokerPayment: EntityStubs.buildStubBrokerPayment(),
      invoice: invoiceStub,
      request: buildStubCreateBrokerPaymentRequest(),
    });
    expect(repositories.persist).toBeCalledTimes(3);
  });
});
