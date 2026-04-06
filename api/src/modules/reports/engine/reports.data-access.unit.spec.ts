import { Test, TestingModule } from '@nestjs/testing';
import { ReportsDataAccess } from './reports.data-access';
import { Repositories } from '@module-persistence/repositories';
import { createMock } from '@golevelup/ts-jest';
import { RecordStatus, InvoiceStatus } from '@module-persistence/entities';
import { WrappedReadable } from '@core/util';

describe('ReportsDataAccess - Volume Report Methods', () => {
  let service: ReportsDataAccess;
  let repositories: jest.Mocked<Repositories>;

  beforeEach(async () => {
    repositories = createMock<Repositories>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsDataAccess,
        {
          provide: Repositories,
          useValue: repositories,
        },
      ],
    }).compile();

    service = module.get<ReportsDataAccess>(ReportsDataAccess);
  });

  describe('getAllClientFactoringConfigsWithTeamDataStream', () => {
    it('should return a wrapped readable stream of client factoring configs', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        getKnexQuery: jest.fn().mockReturnValue({
          stream: jest.fn().mockReturnValue({
            on: jest.fn(),
          }),
        }),
      };

      repositories.clientFactoringConfig.readOnlyQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const result =
        await service.getAllClientFactoringConfigsWithTeamDataStream();

      expect(result).toBeInstanceOf(WrappedReadable);
      expect(
        repositories.clientFactoringConfig.readOnlyQueryBuilder,
      ).toHaveBeenCalledWith('cfc');
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledTimes(3);
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'cfc.clientSuccessTeam',
        'cst',
      );
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'cfc.salesRep',
        'e',
      );
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith('e.user', 'u');
    });
  });

  describe('getVolumeReportInvoiceData', () => {
    it('should return a map of invoice data by client_id', async () => {
      const startDate = new Date('2026-01-31');
      const endDate = new Date('2026-02-16');

      const mockResults = [
        {
          clientId: 'client-1',
          ar_total: '1000000',
          factor_fees_total: '30000',
        },
        {
          clientId: 'client-2',
          ar_total: '500000',
          factor_fees_total: '15000',
        },
      ];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockResults),
      };

      repositories.invoice.readOnlyQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const result = await service.getVolumeReportInvoiceData(
        startDate,
        endDate,
      );

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(2);
      expect(result.get('client-1')).toEqual({
        client_id: 'client-1',
        ar_total: '1000000',
        factor_fees_total: '30000',
      });
      expect(result.get('client-2')).toEqual({
        client_id: 'client-2',
        ar_total: '500000',
        factor_fees_total: '15000',
      });
    });

    it('should query with correct filters', async () => {
      const startDate = new Date('2026-01-31');
      const endDate = new Date('2026-02-16');

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue([]),
      };

      repositories.invoice.readOnlyQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      await service.getVolumeReportInvoiceData(startDate, endDate);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith({
        recordStatus: RecordStatus.Active,
        status: InvoiceStatus.Purchased,
        purchasedDate: { $gte: startDate, $lte: endDate },
      });
      expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith('i.client_id');
    });

    it('should return empty map when no invoices found', async () => {
      const startDate = new Date('2026-01-31');
      const endDate = new Date('2026-02-16');

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue([]),
      };

      repositories.invoice.readOnlyQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const result = await service.getVolumeReportInvoiceData(
        startDate,
        endDate,
      );

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });
  });
});
