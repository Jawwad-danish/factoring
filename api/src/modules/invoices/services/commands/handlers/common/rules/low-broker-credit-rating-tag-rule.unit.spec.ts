import { mockToken } from '@core/test';
import { CreateInvoiceRequest } from '@fs-bobtail/factoring/data';
import { BrokerRating } from '@module-brokers';
import { buildStubBroker } from '@module-brokers/test';
import { buildStubClient } from '@module-clients/test';
import { buildStubCreateInvoiceRequest } from '@module-invoices/test';
import { TagDefinitionKey } from '@module-persistence/entities';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import { LowBrokerCreditRatingTagRule } from './low-broker-credit-rating-tag-rule';

describe('Low Credit Broker Rule', () => {
  let lowCreditBrokerRule: LowBrokerCreditRatingTagRule<CreateInvoiceRequest>;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LowBrokerCreditRatingTagRule],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    lowCreditBrokerRule = module.get(LowBrokerCreditRatingTagRule);
  }, 60000);

  it('LowCreditBrokerRule should be defined', () => {
    expect(lowCreditBrokerRule).toBeDefined();
  });

  it('If broker has low credit and tag definition found, returns tag activity', async () => {
    const result = await lowCreditBrokerRule.run({
      entity: EntityStubs.buildStubInvoice(),
      client: buildStubClient(),
      broker: buildStubBroker({ rating: BrokerRating.F }),
      payload: buildStubCreateInvoiceRequest(),
    });

    expect(result.actions[0].key).toBe(
      TagDefinitionKey.LOW_BROKER_CREDIT_RATING,
    );
    expect(result.actions[0].noteDetails).not.toBeNull();
  });
});
