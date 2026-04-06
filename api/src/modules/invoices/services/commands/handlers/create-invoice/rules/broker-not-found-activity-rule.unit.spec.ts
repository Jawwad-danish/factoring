import { mockToken } from '@core/test';
import { buildStubClient } from '@module-clients/test';
import { buildStubCreateInvoiceRequest } from '@module-invoices/test';
import { TagDefinitionKey } from '@module-persistence/entities';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { CreateInvoiceBrokerNotFoundActivityRule } from './broker-not-found-activity-rule';
import { EntityStubs } from '@module-persistence/test';

describe('CreateInvoiceBrokerNotFoundActivityRule', () => {
  let rule: CreateInvoiceBrokerNotFoundActivityRule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreateInvoiceBrokerNotFoundActivityRule],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    rule = module.get(CreateInvoiceBrokerNotFoundActivityRule);
  });

  it('Should be defined', () => {
    expect(rule).toBeDefined();
  });

  it('When payload does not have broker, activity log is built', async () => {
    const result = await rule.run({
      entity: EntityStubs.buildStubInvoice(),
      client: buildStubClient(),
      broker: null,
      payload: buildStubCreateInvoiceRequest({
        brokerId: null,
      }),
    });

    expect(result.actions[0].key).toBe(TagDefinitionKey.BROKER_NOT_FOUND);
    expect(result.actions[0].noteDetails).not.toBeNull();
  });

  it('When payload has broker, activity log is empty', async () => {
    const result = await rule.run({
      entity: EntityStubs.buildStubInvoice(),
      client: buildStubClient(),
      broker: null,
      payload: buildStubCreateInvoiceRequest({
        brokerId: UUID.get(),
      }),
    });

    expect(result.isEmpty()).toBe(true);
  });
});
