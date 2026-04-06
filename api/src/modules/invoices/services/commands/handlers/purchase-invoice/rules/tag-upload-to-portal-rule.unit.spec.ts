import { mockToken } from '@core/test';
import { buildStubBroker } from '@module-brokers/test';
import { buildStubClient } from '@module-clients/test';
import {
  CommandInvoiceContext,
  PurchaseInvoiceRequest,
} from '@module-invoices/data';
import { EntityStubs } from '@module-persistence/test';
import { TagDefinitionKey } from '@module-persistence/entities';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import { TagUploadToPortalRule } from '.';

describe('Upload to portal rule', () => {
  let rule: TagUploadToPortalRule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TagUploadToPortalRule],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    rule = module.get(TagUploadToPortalRule);
  }, 60000);

  it('Expect Upload to portal rule should be defined', () => {
    expect(rule).toBeDefined();
  });

  it('Tag invoice with upload to portal if delivery method other than email', async () => {
    const payload = new PurchaseInvoiceRequest();
    const entity = EntityStubs.buildStubInvoice({
      lineHaulRate: Big(1000),
      detention: Big(0),
      advance: Big(0),
      lumper: Big(0),
      deduction: Big(0),
    });

    const client = buildStubClient();
    const broker = buildStubBroker();
    broker.emails = [];
    broker.portalUrl = 'http://portal-url.com';

    const context: CommandInvoiceContext<PurchaseInvoiceRequest> = {
      client: client,
      broker: broker,
      entity: entity,
      payload: payload,
    };

    const result = await rule.run(context);
    expect(result.actions[0].key).toBe(
      TagDefinitionKey.UPLOAD_INVOICE_TO_PORTAL,
    );
  });
});
