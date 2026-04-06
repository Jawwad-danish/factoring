import { mockMikroORMProvider, mockToken } from '@core/test';
import { UUID } from '@core/uuid';
import { createMock } from '@golevelup/ts-jest';
import { QueryBuilder } from '@mikro-orm/postgresql';
import { InvoiceEntity } from '@module-persistence/entities';
import { InvoiceRepository } from '@module-persistence/repositories';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import { LoadNumberSplitRule } from './load-number-split-rule';

const mockInvoiceQueryBuilder = (invoices: InvoiceEntity[]) => {
  return createMock<QueryBuilder<InvoiceEntity>>({
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue(invoices),
  });
};

describe('LoadNumberSplitRule', () => {
  let rule: LoadNumberSplitRule;
  let invoiceRepository: InvoiceRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoadNumberSplitRule, mockMikroORMProvider],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    rule = module.get(LoadNumberSplitRule);
    invoiceRepository = module.get(InvoiceRepository);
  });

  it('Rule should be defined', () => {
    expect(rule).toBeDefined();
  });

  it('should have possible duplicate results if load numbers are similar on different invoices', async () => {
    jest.spyOn(invoiceRepository, 'queryBuilder').mockReturnValueOnce(
      mockInvoiceQueryBuilder([
        EntityStubs.buildStubInvoice({
          loadNumber: 'jan01inv01',
        }),
      ]),
    );
    const result = await rule.run({
      invoice: EntityStubs.buildStubInvoice({
        loadNumber: 'inv01',
      }),
    });
    expect(result.count()).toBe(1);
    for (const [weight, invoices] of result) {
      expect(weight).toBe(3);
      expect(invoices).toHaveLength(1);
    }
  });

  it('should not find any possible duplicates if the same invoice is found', async () => {
    const id = UUID.get();
    jest.spyOn(invoiceRepository, 'queryBuilder').mockReturnValueOnce(
      mockInvoiceQueryBuilder([
        EntityStubs.buildStubInvoice({
          id,
          loadNumber: 'jan01inv01',
        }),
      ]),
    );
    const result = await rule.run({
      invoice: EntityStubs.buildStubInvoice({
        id,
        loadNumber: 'inv01',
      }),
    });
    expect(result.count()).toBe(0);
  });

  it('should not find any possible duplicates if load numbers are not similar', async () => {
    jest.spyOn(invoiceRepository, 'queryBuilder').mockReturnValueOnce(
      mockInvoiceQueryBuilder([
        EntityStubs.buildStubInvoice({
          loadNumber: 'jan01inv01',
        }),
      ]),
    );
    const result = await rule.run({
      invoice: EntityStubs.buildStubInvoice({
        loadNumber: 'inv02',
      }),
    });
    expect(result.count()).toBe(0);
  });
});
