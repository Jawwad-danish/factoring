import { InvoiceStatus } from '@module-persistence/entities';
import { mockToken } from '@core/test';
import { buildStubClient } from '@module-clients/test';
import { buildStubBroker } from '@module-brokers/test';
import { Test, TestingModule } from '@nestjs/testing';
import { buildStubUpdateInvoiceAmounts } from '@module-invoices/test';
import { RejectedToUnderReviewRule } from './rejected-to-under-review-rule';
import { EntityStubs } from '@module-persistence/test';

describe('RejectedToPendingRule', () => {
  let rule: RejectedToUnderReviewRule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RejectedToUnderReviewRule],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    rule = module.get(RejectedToUnderReviewRule);
  });

  it('Should be defined', () => {
    expect(rule).toBeDefined();
  });

  it('If invoice is rejected and update is done, status is changed to pending', async () => {
    const entity = EntityStubs.buildStubInvoice({
      status: InvoiceStatus.Rejected,
    });
    const result = await rule.run({
      entity,
      client: buildStubClient(),
      broker: buildStubBroker(),
      payload: buildStubUpdateInvoiceAmounts(),
    });

    expect(entity.status).toBe(InvoiceStatus.UnderReview);
    expect(result.actions).toStrictEqual([]);
  });

  it('If invoice is not rejected and update is done, status is the same', async () => {
    const entity = EntityStubs.buildStubInvoice({
      status: InvoiceStatus.Purchased,
    });
    const result = await rule.run({
      entity,
      client: buildStubClient(),
      broker: buildStubBroker(),
      payload: buildStubUpdateInvoiceAmounts(),
    });

    expect(entity.status).toBe(InvoiceStatus.Purchased);
    expect(result.actions).toStrictEqual([]);
  });
});
