import { dollarsToPennies } from '@core/formulas';
import { mockToken } from '@core/test';
import { buildStubBroker } from '@module-brokers/test';
import { buildStubClient } from '@module-clients/test';
import { buildStubCreateInvoiceRequest } from '@module-invoices/test';
import { InvoiceRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { TagClientLimitRule } from './tag-client-limit-rule';
import { EntityStubs } from '@module-persistence/test';

describe('TagClientLimitRule', () => {
  let rule: TagClientLimitRule;
  let invoiceRepository: InvoiceRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TagClientLimitRule],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    rule = module.get(TagClientLimitRule);
    invoiceRepository = module.get(InvoiceRepository);
  });

  it('Should be defined', () => {
    expect(rule).toBeDefined();
  });

  it('When no client limit is set the rule is ignored', async () => {
    const result = await rule.run({
      entity: EntityStubs.buildStubInvoice({
        lineHaulRate: dollarsToPennies(10000),
      }),
      client: buildStubClient({
        factoringConfig: {
          clientLimitAmount: null,
        },
      }),
      broker: buildStubBroker(),
      payload: buildStubCreateInvoiceRequest(),
    });

    expect(result.isEmpty()).toBe(true);
  });

  it('When AR amount and invoice amount is less than the client limit then rule is ignored', async () => {
    jest
      .spyOn(invoiceRepository, 'getLast30DaysTotalARUnpaidByClient')
      .mockResolvedValueOnce(dollarsToPennies(1000).toNumber());
    const result = await rule.run({
      entity: EntityStubs.buildStubInvoice({
        lineHaulRate: dollarsToPennies(3000),
      }),
      client: buildStubClient({
        factoringConfig: {
          clientLimitAmount: dollarsToPennies(5000),
        },
      }),
      broker: buildStubBroker(),
      payload: buildStubCreateInvoiceRequest(),
    });

    expect(result.isEmpty()).toBe(true);
  });

  it('When AR amount is higher than the client limit then the invoice is tagged', async () => {
    jest
      .spyOn(invoiceRepository, 'getLast30DaysTotalARUnpaidByClient')
      .mockResolvedValueOnce(dollarsToPennies(1000).toNumber());
    const result = await rule.run({
      entity: EntityStubs.buildStubInvoice({
        lineHaulRate: dollarsToPennies(3000),
      }),
      client: buildStubClient({
        factoringConfig: {
          clientLimitAmount: dollarsToPennies(5000),
        },
      }),
      broker: buildStubBroker(),
      payload: buildStubCreateInvoiceRequest(),
    });

    expect(result.isEmpty()).toBe(true);
  });
});
