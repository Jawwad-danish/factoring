import { mockToken } from '@core/test';
import { EntityStubs } from '@module-persistence/test';
import { InvoiceRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { FirstInvoiceCheck } from './first-invoice-check';
import { buildStubClient } from '@module-clients/test';

describe('FirstInvoiceCheck', () => {
  let check: FirstInvoiceCheck;
  let invoiceRepository: InvoiceRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FirstInvoiceCheck],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    check = module.get(FirstInvoiceCheck);
    invoiceRepository = module.get(InvoiceRepository);
  });

  it('Should be defined', () => {
    expect(check).toBeDefined();
  });

  it('Should return null when client total created invoices are greater than 0', async () => {
    jest.spyOn(invoiceRepository, 'countByClient').mockResolvedValue(1);

    const result = await check.run({
      invoice: EntityStubs.buildStubInvoice(),
      client: buildStubClient(),
    });
    expect(result).toBe(null);
  });

  it('Should return null when client total created invoices are 0', async () => {
    jest.spyOn(invoiceRepository, 'countByClient').mockResolvedValue(0);

    const result = await check.run({
      invoice: EntityStubs.buildStubInvoice(),
      client: buildStubClient(),
    });
    expect(result).not.toBeNull();
    expect(result?.note).not.toBeNull();
    expect(result?.payload).not.toBeNull();
    expect(result?.payload?.cause).toBe('FirstInvoice');
  });
});
