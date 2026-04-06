import { Test, TestingModule } from '@nestjs/testing';
import { DetailedAgingReportCommandHandler } from './detailed-aging.command-handler';
import { ReportHandler } from '../report-handler';
import { ReportsDataAccess } from '../../../reports.data-access';
import { Repositories } from '@module-persistence/repositories';
import { ClientApi, LightweightClient } from '@module-clients';
import { BrokerApi, LightweightBroker } from '@module-brokers';
import { DetailedAgingReportCommand } from '../../detailed-aging.command';
import { Readable } from 'stream';
import { RecordStatus, ReportName } from '@module-persistence/entities';
import { buildStubDetailedAgingRequest } from '@module-reports';
import { createMock } from '@golevelup/ts-jest';
import { WrappedReadable } from '@core/streams';
import { RawDetailedAgingData } from '../../../data-access-types';

describe('DetailedAgingReportCommandHandler', () => {
  let handler: DetailedAgingReportCommandHandler;

  const reportHandler = createMock<ReportHandler>();
  const reportsDataAccess = createMock<ReportsDataAccess>();
  const clientApi = createMock<ClientApi>();
  const brokerApi = createMock<BrokerApi>();
  const repositories = createMock<Repositories>();

  beforeEach(async () => {
    jest.clearAllMocks();

    // Properly set up the nested mock structure
    (repositories.clientFactoringConfig as any) = {
      readOnlyQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DetailedAgingReportCommandHandler,
        {
          provide: ReportHandler,
          useValue: reportHandler,
        },
        {
          provide: ReportsDataAccess,
          useValue: reportsDataAccess,
        },
        {
          provide: Repositories,
          useValue: repositories,
        },
        {
          provide: ClientApi,
          useValue: clientApi,
        },
        {
          provide: BrokerApi,
          useValue: brokerApi,
        },
      ],
    }).compile();

    handler = module.get<DetailedAgingReportCommandHandler>(
      DetailedAgingReportCommandHandler,
    );
  });

  describe('execute', () => {
    it('should process detailed aging report successfully', async () => {
      const request = buildStubDetailedAgingRequest();
      const command = new DetailedAgingReportCommand(request);
      const mockStream = new Readable();

      jest.spyOn(handler, 'getReportDataStream').mockResolvedValue(mockStream);
      reportHandler.processReport.mockResolvedValue(mockStream);

      const result = await handler.execute(command);

      expect(handler.getReportDataStream).toHaveBeenCalledWith(request);
      expect(reportHandler.processReport).toHaveBeenCalledWith(
        request.outputType,
        ReportName.DetailedAging,
        mockStream,
        expect.objectContaining({
          formatDefinition: expect.any(Object),
          metadataRow: expect.any(String),
        }),
      );
      expect(result).toBe(mockStream);
    });
  });

  describe('getReportDataStream', () => {
    it('should fetch and transform data successfully', async () => {
      const request = buildStubDetailedAgingRequest();
      const mockRawStream = new WrappedReadable<RawDetailedAgingData>(
        Readable.from([]),
      );
      const mockClients = [
        {
          id: 'client-1',
          name: 'Test Client',
          mc: 'MC123',
          dot: 'DOT456',
        } as LightweightClient,
      ];
      const mockBrokers = [
        {
          id: 'broker-1',
          doingBusinessAs: 'Test Broker',
          mc: 'MC789',
          dot: 'DOT012',
        } as LightweightBroker,
      ];

      reportsDataAccess.getDetailedAging.mockResolvedValue(mockRawStream);
      clientApi.getAllClients.mockResolvedValue(mockClients);
      brokerApi.getAllBrokers.mockResolvedValue(mockBrokers);

      const queryBuilderMock = {
        select: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest
          .fn()
          .mockResolvedValue([{ client_id: 'client-1', name: 'Success Team' }]),
      };
      (
        repositories.clientFactoringConfig.readOnlyQueryBuilder as jest.Mock
      ).mockReturnValue(queryBuilderMock as any);

      const result = await handler.getReportDataStream(request);

      expect(reportsDataAccess.getDetailedAging).toHaveBeenCalledWith(
        request.date,
      );
      expect(clientApi.getAllClients).toHaveBeenCalled();
      expect(brokerApi.getAllBrokers).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Readable);
    });

    it('should handle errors and rethrow', async () => {
      const request = buildStubDetailedAgingRequest();
      const error = new Error('Database error');

      reportsDataAccess.getDetailedAging.mockRejectedValue(error);

      await expect(handler.getReportDataStream(request)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('createClientSuccessTeamMapping', () => {
    it('should create mapping of client IDs to success team names', async () => {
      const clientIds = ['client-1', 'client-2'];
      const queryBuilderMock = {
        select: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue([
          { client_id: 'client-1', name: 'Team A' },
          { client_id: 'client-2', name: 'Team B' },
        ]),
      };

      (
        repositories.clientFactoringConfig.readOnlyQueryBuilder as jest.Mock
      ).mockReturnValue(queryBuilderMock as any);

      const result = await handler['createClientSuccessTeamMapping'](clientIds);

      expect(result.get('client-1')).toBe('Team A');
      expect(result.get('client-2')).toBe('Team B');
      expect(queryBuilderMock.where).toHaveBeenCalledWith({
        clientId: { $in: clientIds },
        recordStatus: RecordStatus.Active,
      });
    });
  });

  describe('getMetadataRow', () => {
    it('should generate metadata row with formatted dates', () => {
      const request = buildStubDetailedAgingRequest({
        date: new Date('2026-03-01T10:00:00Z'),
      });

      const result = handler['getMetadataRow'](request);

      expect(result).toContain('Detailed Aging Report');
      expect(result).toContain('Date ran:');
    });
  });
});
