import { mockToken } from '@core/test';
import { EntityStubs } from '@module-persistence/test';
import { buildStubClient } from '@module-clients/test';
import {
  InvoiceRepository,
  ReserveRepository,
} from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientReservesCheck } from './client-reserves-check';

describe('ClientReservesCheck', () => {
  let check: ClientReservesCheck;
  let reservesRepository: ReserveRepository;
  let invoiceRepository: InvoiceRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientReservesCheck],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    check = module.get(ClientReservesCheck);
    reservesRepository = module.get(ReserveRepository);
    invoiceRepository = module.get(InvoiceRepository);
  });

  it('Should be defined', () => {
    expect(check).toBeDefined();
  });

  it('Should return null when total reserves are less than the limit', async () => {
    jest.spyOn(reservesRepository, 'getTotalByClient').mockResolvedValue(500);
    jest
      .spyOn(invoiceRepository, 'getLast30DaysTotalARUnpaidByClient')
      .mockResolvedValue(0);
    const result = await check.run({
      invoice: EntityStubs.buildStubInvoice(),
      client: buildStubClient(),
    });
    expect(result).toBe(null);
  });

  it('Should return payload when total reserves are higher than the limit', async () => {
    jest
      .spyOn(reservesRepository, 'getTotalByClient')
      .mockResolvedValue(-200000);
    jest
      .spyOn(invoiceRepository, 'getLast30DaysTotalARUnpaidByClient')
      .mockResolvedValue(10000);
    const result = await check.run({
      invoice: EntityStubs.buildStubInvoice(),
      client: buildStubClient(),
    });
    expect(result).not.toBeNull();
    expect(result?.note).not.toBeNull();
    expect(result?.payload).not.toBeNull();
    expect(result?.payload?.cause).toBe('ClientReserves');
  });
});
