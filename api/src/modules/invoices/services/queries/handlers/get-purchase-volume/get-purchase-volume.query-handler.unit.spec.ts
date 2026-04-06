import {
  getDateInBusinessTimezone,
  startOfDay,
  endOfDay,
} from '@core/date-time';
import { mockToken } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import {
  ClientPaymentStatus,
  InvoiceStatus,
} from '@module-persistence/entities';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import { InvoiceVolumeStats, PurchaseVolume } from '../../../../data';
import { InvoiceDataAccess } from '../../../invoice-data-access';
import { GetPurchaseVolumeQuery } from '../../get-purchase-volume.query';
import { GetPurchaseVolumeQueryHandler } from './get-purchase-volume.query-handler';

jest.mock('@core/date-time', () => ({
  getDateInBusinessTimezone: jest.fn(),
  startOfDay: jest.fn(),
  endOfDay: jest.fn(),
}));

describe('GetPurchaseVolumeQueryHandler', () => {
  const invoiceDataAccess = createMock<InvoiceDataAccess>();
  let handler: GetPurchaseVolumeQueryHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GetPurchaseVolumeQueryHandler, InvoiceDataAccess],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .overrideProvider(InvoiceDataAccess)
      .useValue(invoiceDataAccess)
      .compile();

    handler = module.get(GetPurchaseVolumeQueryHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    const mockToday = {
      toDate: jest.fn().mockReturnValue(new Date('2024-01-01T12:00:00Z')),
    };

    beforeEach(() => {
      (getDateInBusinessTimezone as jest.Mock).mockReturnValue(mockToday);
      (startOfDay as jest.Mock).mockReturnValue({
        toDate: jest.fn().mockReturnValue(new Date('2024-01-01T00:00:00Z')),
      });
      (endOfDay as jest.Mock).mockReturnValue({
        toDate: jest.fn().mockReturnValue(new Date('2024-01-01T23:59:59Z')),
      });
    });

    it('should return purchase volume with correct data', async () => {
      const purchasedNotPaidStats = new InvoiceVolumeStats({
        amount: new Big('1000.50'),
        count: 5,
      });
      const purchasedPaidStats = new InvoiceVolumeStats({
        amount: new Big('2500.75'),
        count: 10,
      });

      invoiceDataAccess.getPurchaseVolume
        .mockResolvedValueOnce(purchasedNotPaidStats)
        .mockResolvedValueOnce(purchasedPaidStats);

      const query = new GetPurchaseVolumeQuery();
      const result = await handler.execute(query);

      expect(result).toBeInstanceOf(PurchaseVolume);
      expect(result.purchasedUnpaid).toBe(purchasedNotPaidStats);
      expect(result.purchasedPaid).toBe(purchasedPaidStats);
    });

    it('should call invoiceDataAccess with correct filters for purchased not paid invoices', async () => {
      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-01-01T23:59:59Z');

      invoiceDataAccess.getPurchaseVolume
        .mockResolvedValueOnce(
          new InvoiceVolumeStats({ amount: new Big('0'), count: 0 }),
        )
        .mockResolvedValueOnce(
          new InvoiceVolumeStats({ amount: new Big('0'), count: 0 }),
        );

      const query = new GetPurchaseVolumeQuery();
      await handler.execute(query);

      expect(invoiceDataAccess.getPurchaseVolume).toHaveBeenNthCalledWith(1, {
        status: InvoiceStatus.Purchased,
        clientPaymentStatus: {
          $nin: [ClientPaymentStatus.Sent, ClientPaymentStatus.Completed],
        },
        purchasedDate: {
          $gte: startDate,
          $lte: endDate,
        },
      });
    });

    it('should call invoiceDataAccess with correct filters for purchased paid invoices', async () => {
      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-01-01T23:59:59Z');

      invoiceDataAccess.getPurchaseVolume
        .mockResolvedValueOnce(
          new InvoiceVolumeStats({ amount: new Big('0'), count: 0 }),
        )
        .mockResolvedValueOnce(
          new InvoiceVolumeStats({ amount: new Big('0'), count: 0 }),
        );

      const query = new GetPurchaseVolumeQuery();
      await handler.execute(query);

      expect(invoiceDataAccess.getPurchaseVolume).toHaveBeenNthCalledWith(2, {
        status: InvoiceStatus.Purchased,
        clientPaymentStatus: {
          $in: [ClientPaymentStatus.Sent, ClientPaymentStatus.Completed],
        },
        purchasedDate: {
          $gte: startDate,
          $lte: endDate,
        },
      });
    });

    it('should use business timezone for date calculations', async () => {
      invoiceDataAccess.getPurchaseVolume
        .mockResolvedValueOnce(
          new InvoiceVolumeStats({ amount: new Big('0'), count: 0 }),
        )
        .mockResolvedValueOnce(
          new InvoiceVolumeStats({ amount: new Big('0'), count: 0 }),
        );

      const query = new GetPurchaseVolumeQuery();
      await handler.execute(query);

      expect(getDateInBusinessTimezone).toHaveBeenCalledTimes(1);
      expect(startOfDay).toHaveBeenCalledTimes(1);
      expect(endOfDay).toHaveBeenCalledTimes(1);
    });
  });
});
