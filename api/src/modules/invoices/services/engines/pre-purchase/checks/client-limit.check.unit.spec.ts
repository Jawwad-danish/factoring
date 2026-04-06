import { mockToken } from '@core/test';
import { buildStubClient } from '@module-clients/test';
import { PurchaseInvoiceRequest } from '@module-invoices/data';
import { EntityStubs } from '@module-persistence/test';
import { InvoiceRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import { PrePurchaseCheckCode } from '../../../../data';
import { ClientLimitCheck } from './client-limit.check';

describe('ClientLimitCheck', () => {
  let check: ClientLimitCheck;
  let invoiceRepository: InvoiceRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientLimitCheck],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    check = module.get<ClientLimitCheck>(ClientLimitCheck);
    invoiceRepository = module.get<InvoiceRepository>(InvoiceRepository);
  }, 60000);

  it('should be defined', () => {
    expect(check).toBeDefined();
  });

  describe('run', () => {
    it('should return null when client has no limit amount set', async () => {
      const client = buildStubClient({
        factoringConfig: {
          ...buildStubClient().factoringConfig,
          clientLimitAmount: null,
        },
      });
      const invoice = EntityStubs.buildStubInvoice({ value: Big(1000) });
      const payload = new PurchaseInvoiceRequest();

      const result = await check.run({ payload, invoice, client });

      expect(result).toBeNull();
      expect(
        invoiceRepository.getLast30DaysTotalARUnpaidByClient,
      ).not.toHaveBeenCalled();
    });

    it('should return null when total amount is within client limit', async () => {
      const client = buildStubClient({
        factoringConfig: {
          ...buildStubClient().factoringConfig,
          clientLimitAmount: Big(5000),
        },
      });
      const invoice = EntityStubs.buildStubInvoice({ value: Big(1000) });
      const payload = new PurchaseInvoiceRequest();

      jest
        .spyOn(invoiceRepository, 'getLast30DaysTotalARUnpaidByClient')
        .mockResolvedValue(3000);

      const result = await check.run({ payload, invoice, client });

      expect(result).toBeNull();
      expect(
        invoiceRepository.getLast30DaysTotalARUnpaidByClient,
      ).toHaveBeenCalledWith(client.id);
    });

    it('should return warning when total amount exceeds client limit', async () => {
      const clientLimitAmount = Big(5000);
      const client = buildStubClient({
        factoringConfig: {
          ...buildStubClient().factoringConfig,
          clientLimitAmount,
        },
      });
      const invoice = EntityStubs.buildStubInvoice({ value: Big(2000) });
      const payload = new PurchaseInvoiceRequest();

      jest
        .spyOn(invoiceRepository, 'getLast30DaysTotalARUnpaidByClient')
        .mockResolvedValue(4000);

      const result = await check.run({ payload, invoice, client });

      expect(result).not.toBeNull();
      expect(result?.code).toBe(PrePurchaseCheckCode.ClientLimitExceeded);
      expect(result?.note).toBe('Client limit exceeded');
      expect(result?.details).toEqual({
        cause: 'Client limit exceeded',
        clientLimit: clientLimitAmount.toString(),
        newTotal: '6000',
      });
    });

    it('should consider deduction when calculating total amount', async () => {
      const clientLimitAmount = Big(4900);
      const client = buildStubClient({
        factoringConfig: {
          ...buildStubClient().factoringConfig,
          clientLimitAmount,
        },
      });
      const invoice = EntityStubs.buildStubInvoice({ value: Big(2000) });
      const payload = new PurchaseInvoiceRequest({ deduction: Big(500) });

      jest
        .spyOn(invoiceRepository, 'getLast30DaysTotalARUnpaidByClient')
        .mockResolvedValue(3500);

      const result = await check.run({ payload, invoice, client });

      expect(result).not.toBeNull();
      expect(result?.code).toBe(PrePurchaseCheckCode.ClientLimitExceeded);
      expect(result?.details.newTotal).toBe('5000');
    });

    it('should return null when total amount with deduction is within client limit', async () => {
      const clientLimitAmount = Big(5000);
      const client = buildStubClient({
        factoringConfig: {
          ...buildStubClient().factoringConfig,
          clientLimitAmount,
        },
      });
      const invoice = EntityStubs.buildStubInvoice({ value: Big(2000) });
      const payload = new PurchaseInvoiceRequest();
      payload.deduction = Big(1000);

      jest
        .spyOn(invoiceRepository, 'getLast30DaysTotalARUnpaidByClient')
        .mockResolvedValue(3500);

      const result = await check.run({ payload, invoice, client });

      expect(result).toBeNull();
    });
  });
});
