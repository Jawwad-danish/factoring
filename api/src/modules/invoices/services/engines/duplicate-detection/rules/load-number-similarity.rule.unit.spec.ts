import { mockMikroORMProvider, mockToken } from '@core/test';
import { InvoiceRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import { EntityStubs } from '@module-persistence/test';
import { LoadNumberSimilarityRule } from './load-number-similarity.rule';

describe('LoadNumberSimilarityRule', () => {
  let rule: LoadNumberSimilarityRule;
  let invoiceRepository: InvoiceRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoadNumberSimilarityRule, mockMikroORMProvider],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    rule = module.get(LoadNumberSimilarityRule);
    invoiceRepository = module.get(InvoiceRepository);
  });

  it('Rule should be defined', () => {
    expect(rule).toBeDefined();
  });

  it('When similarity is within 50 and 70 it has a weight of 1', async () => {
    jest
      .spyOn(invoiceRepository, 'findSimilarByLoadNumber')
      .mockResolvedValueOnce([
        {
          similarity: new Big(0.6),
          invoice: EntityStubs.buildStubInvoice(),
        },
      ]);

    const result = await rule.run({
      invoice: EntityStubs.buildStubInvoice(),
    });

    expect(result.isEmpty()).toBeFalsy();
    for (const [weight, invoices] of result) {
      expect(weight).toBe(1);
      expect(invoices.length).toBe(1);
    }
  });

  it('When similarity is within 70 and 80 it has a weight of 2', async () => {
    jest
      .spyOn(invoiceRepository, 'findSimilarByLoadNumber')
      .mockResolvedValueOnce([
        {
          similarity: new Big(0.75),
          invoice: EntityStubs.buildStubInvoice(),
        },
      ]);

    const result = await rule.run({
      invoice: EntityStubs.buildStubInvoice(),
    });

    expect(result.isEmpty()).toBeFalsy();
    for (const [weight, invoices] of result) {
      expect(weight).toBe(2);
      expect(invoices.length).toBe(1);
    }
  });

  it('When similarity is within 80 and 90 it has a weight of 3', async () => {
    jest
      .spyOn(invoiceRepository, 'findSimilarByLoadNumber')
      .mockResolvedValueOnce([
        {
          similarity: new Big(0.85),
          invoice: EntityStubs.buildStubInvoice(),
        },
      ]);

    const result = await rule.run({
      invoice: EntityStubs.buildStubInvoice(),
    });

    expect(result.isEmpty()).toBeFalsy();
    for (const [weight, invoices] of result) {
      expect(weight).toBe(3);
      expect(invoices.length).toBe(1);
    }
  });

  it('When similarity is within 90 and 100 it has a weight of 4', async () => {
    jest
      .spyOn(invoiceRepository, 'findSimilarByLoadNumber')
      .mockResolvedValueOnce([
        {
          similarity: new Big(0.99),
          invoice: EntityStubs.buildStubInvoice(),
        },
      ]);

    const result = await rule.run({
      invoice: EntityStubs.buildStubInvoice(),
    });

    expect(result.isEmpty()).toBeFalsy();
    for (const [weight, invoices] of result) {
      expect(weight).toBe(4);
      expect(invoices.length).toBe(1);
    }
  });
});
