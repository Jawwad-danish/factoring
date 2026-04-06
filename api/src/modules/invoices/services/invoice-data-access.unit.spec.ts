import { mockMikroORMProvider } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import {
  BrokerPaymentRepository,
  InvoiceRepository,
  Repositories,
} from '@module-persistence/repositories';
import { Test } from '@nestjs/testing';
import { InvoiceDataAccess } from './invoice-data-access';

describe('InvoiceDataAccess', () => {
  let dataAccess: InvoiceDataAccess;

  const invoiceRepository = createMock<InvoiceRepository>();
  const brokerPaymentRepository = createMock<BrokerPaymentRepository>();
  const repositories = createMock<Repositories>({
    invoice: invoiceRepository,
    brokerPayment: brokerPaymentRepository,
    execute: jest.fn(),
  });

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [mockMikroORMProvider, Repositories, InvoiceDataAccess],
    })
      .overrideProvider(Repositories)
      .useValue(repositories)
      .compile();

    dataAccess = module.get(InvoiceDataAccess);
  });

  it('When no invoices, dilution rate is 99', async () => {
    jest.spyOn(repositories, 'execute').mockResolvedValue([{ leftToPay: 100 }]);
    jest
      .spyOn(invoiceRepository, 'totalAccountsReceivableByClient')
      .mockResolvedValueOnce(0);

    const result = await dataAccess.getDilutionRate('id');
    expect(result.toNumber()).toBe(99);
  });

  it('When shortpaid invoices, dilution rate is calculated', async () => {
    jest.spyOn(repositories, 'execute').mockResolvedValue([{ leftToPay: 50 }]);
    jest
      .spyOn(invoiceRepository, 'totalAccountsReceivableByClient')
      .mockResolvedValueOnce(100);

    const result = await dataAccess.getDilutionRate('id');
    expect(result.toNumber()).toBe(50);
  });
});
