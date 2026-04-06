import { mockToken } from '@core/test';
import { buildStubClient } from '@module-clients/test';
import {
  CommandInvoiceContext,
  PurchaseInvoiceRequest,
} from '@module-invoices/data';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import { ConvertToExpeditedRule } from './convert-to-expedited-rule';

describe('ConvertToExpeditedRule', () => {
  let rule: ConvertToExpeditedRule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConvertToExpeditedRule],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    rule = module.get(ConvertToExpeditedRule);
  }, 60000);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(rule).toBeDefined();
  });

  it('Sets expedited to true when client is configured to expedite only', async () => {
    const client = buildStubClient();
    client.factoringConfig.expediteTransferOnly = true;

    const entity = EntityStubs.buildStubInvoice();
    entity.expedited = false;

    const payload = new PurchaseInvoiceRequest();

    const context: CommandInvoiceContext<PurchaseInvoiceRequest> = {
      client,
      broker: null,
      entity,
      payload,
    };

    const result = await rule.run(context);

    expect(entity.expedited).toBe(true);
    expect(result.isEmpty()).toBe(true);
  });

  it('Does not change expedited when client is not configured to expedite only', async () => {
    const client = buildStubClient();
    client.factoringConfig.expediteTransferOnly = false;

    const entity = EntityStubs.buildStubInvoice();
    entity.expedited = false;

    const payload = new PurchaseInvoiceRequest();

    const context: CommandInvoiceContext<PurchaseInvoiceRequest> = {
      client,
      broker: null,
      entity,
      payload,
    };

    const result = await rule.run(context);

    expect(entity.expedited).toBe(false);
    expect(result.isEmpty()).toBe(true);
  });
});
