import { mockMikroORMProvider, mockToken } from '@core/test';
import { InvoiceRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityStubs } from '@module-persistence/test';
import { MonetarySimilarityRule } from './monetary-similarity-rule';

describe('MonetarySimilarityRule', () => {
  let rule: MonetarySimilarityRule;
  let invoiceRepository: InvoiceRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MonetarySimilarityRule, mockMikroORMProvider],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    rule = module.get(MonetarySimilarityRule);
    invoiceRepository = module.get(InvoiceRepository);
  });

  it('Rule should be defined', () => {
    expect(rule).toBeDefined();
  });

  it('When results are found the weight is 1', async () => {
    jest
      .spyOn(invoiceRepository, 'getExplicitInvoiceFields')
      .mockResolvedValueOnce([EntityStubs.buildStubMonetaryInvoice()]);

    const result = await rule.run({
      invoice: EntityStubs.buildStubInvoice(),
    });

    expect(result.isEmpty()).toBeFalsy();
    for (const [weight, invoices] of result) {
      expect(weight).toBe(1);
      expect(invoices.length).toBe(1);
    }
  });
});
