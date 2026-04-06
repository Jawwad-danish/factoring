import { mockToken } from '@core/test';
import { buildStubUpdateBrokerPaymentRequest } from '@module-broker-payments/test';
import { EntityStubs } from '@module-persistence/test';
import { TagDefinitionKey } from '@module-persistence/entities';
import { Test, TestingModule } from '@nestjs/testing';
import { UpdateBrokerPaymentUpdateInvoiceActivityRule } from './update-broker-payment-invoice-activity.rule';

describe('UpdateBrokerPaymentUpdateInvoiceActivityRule', () => {
  let rule: UpdateBrokerPaymentUpdateInvoiceActivityRule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UpdateBrokerPaymentUpdateInvoiceActivityRule],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    rule = module.get(UpdateBrokerPaymentUpdateInvoiceActivityRule);
  });

  it('Rule should be defined', () => {
    expect(rule).toBeDefined();
  });

  it('Rule returns note for invoice activity', async () => {
    const tagActivity = await rule.run({
      brokerPayment: EntityStubs.buildStubBrokerPayment(),
      invoice: EntityStubs.buildStubInvoice(),
      request: buildStubUpdateBrokerPaymentRequest(),
    });

    expect(tagActivity.isEmpty()).toBe(false);
    expect(tagActivity.actions[0].key).toBe(
      TagDefinitionKey.BROKER_PAYMENT_UPDATE,
    );
  });
});
