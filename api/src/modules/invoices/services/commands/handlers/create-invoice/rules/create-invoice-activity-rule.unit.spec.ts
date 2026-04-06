import { mockToken } from '@core/test';
import { buildStubClient } from '@module-clients/test';
import { buildStubCreateInvoiceRequest } from '@module-invoices/test';
import { TagDefinitionKey } from '@module-persistence/entities';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateInvoiceActivityRule } from './create-invoice-activity-rule';
import { EntityStubs } from '@module-persistence/test';

describe('CreateInvoiceActivityRule', () => {
  let rule: CreateInvoiceActivityRule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreateInvoiceActivityRule],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    rule = module.get(CreateInvoiceActivityRule);
  });

  it('Should be defined', () => {
    expect(rule).toBeDefined();
  });

  it('When tag definition is found, activity log is built', async () => {
    const result = await rule.run({
      entity: EntityStubs.buildStubInvoice(),
      client: buildStubClient(),
      broker: null,
      payload: buildStubCreateInvoiceRequest(),
    });

    expect(result.actions[0].key).toBe(TagDefinitionKey.CREATE_INVOICE);
    expect(result.actions[0].noteDetails).not.toBeNull();
  });
});
