import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'stream';
import { ReportType } from '@fs-bobtail/factoring/data';
import { ReportHandler } from '../report-handler';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { PassThrough } from 'stream';
import { BrokerAgingReportCommandHandler } from './broker-aging.command-handler';
import { BrokerAgingReportCommand } from '../../broker-aging-report.command';
import {
  BrokerAddress,
  BrokerAddressType,
  BrokerService,
} from '@module-brokers';
import { ReportName, RecordStatus } from '@module-persistence/entities';
import { Repositories } from '@module-persistence/repositories';
import { buildStubBroker } from '@module-brokers/test';
import Big from 'big.js';
import { TimeRangeMetrics } from '@common/data';
import { ReportsDataAccess } from '../../../reports.data-access';

const transformMock = new PassThrough();

describe('BrokerAgingReportCommandHandler', () => {
  let handler: BrokerAgingReportCommandHandler;
  const reportHandler = createMock<ReportHandler>();
  const brokerService = createMock<BrokerService>();
  const dataAccess = createMock<ReportsDataAccess>();
  let repositoriesMock: any;

  const mockInvoiceRepository = {
    readOnlyQueryBuilder: jest.fn(),
  };

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    reportHandler.processReport.mockResolvedValue(transformMock);
    mockInvoiceRepository.readOnlyQueryBuilder.mockReturnValue(
      mockQueryBuilder,
    );
    repositoriesMock = createMock<Repositories>();
    repositoriesMock.invoice = mockInvoiceRepository as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrokerAgingReportCommandHandler,
        mockMikroORMProvider,
        {
          provide: ReportHandler,
          useValue: reportHandler,
        },
        {
          provide: BrokerService,
          useValue: brokerService,
        },
        {
          provide: ReportsDataAccess,
          useValue: dataAccess,
        },
        {
          provide: Repositories,
          useValue: repositoriesMock,
        },
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    handler = module.get<BrokerAgingReportCommandHandler>(
      BrokerAgingReportCommandHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should execute broker aging report command', async () => {
      mockQueryBuilder.execute.mockResolvedValue([
        { broker_id: 'broker-1', total: '10000' },
      ]);

      dataAccess.getDaysToPayAverageMetricsByPaymentDate.mockResolvedValue([
        {
          brokerId: 'broker-1',
          metrics: new TimeRangeMetrics({
            last30Days: new Big(15),
            last60Days: new Big(20),
            last90Days: new Big(25),
          }),
        },
      ]);

      const stubBroker = buildStubBroker({
        id: 'broker-1',
        legalName: 'Test Broker LLC',
        mc: '123456',
        dot: '7890',
      });

      brokerService.findByIds.mockResolvedValue([stubBroker]);

      const processReportSpy =
        reportHandler.processReport.mockResolvedValueOnce(Readable.from([]));

      const command = new BrokerAgingReportCommand({
        name: ReportName.BrokerAging,
        outputType: ReportType.CSV,
        sendTo: 'test@example.com',
        date: new Date('2026-02-22'),
        includeAddress: false,
      });

      await handler.execute(command);

      expect(processReportSpy).toHaveBeenCalledTimes(1);
      expect(processReportSpy).toHaveBeenCalledWith(
        ReportType.CSV,
        ReportName.BrokerAging,
        expect.any(Readable),
        expect.objectContaining({
          formatDefinition: expect.any(Object),
          metadataRow: expect.any(String),
        }),
      );
    });

    it('should include address fields in format definition when includeAddress is true', async () => {
      mockQueryBuilder.execute.mockResolvedValue([]);
      dataAccess.getDaysToPayAverageMetricsByPaymentDate.mockResolvedValue([]);
      brokerService.findByIds.mockResolvedValue([]);

      const command = new BrokerAgingReportCommand({
        name: ReportName.BrokerAging,
        outputType: ReportType.CSV,
        sendTo: 'test@example.com',
        date: new Date('2026-02-22'),
        includeAddress: true,
      });

      await handler.execute(command);

      expect(reportHandler.processReport).toHaveBeenCalledWith(
        ReportType.CSV,
        ReportName.BrokerAging,
        expect.any(Readable),
        expect.objectContaining({
          formatDefinition: expect.objectContaining({
            brokerAddress: expect.objectContaining({
              type: 'string',
              label: 'Address',
            }),
            brokerCity: expect.objectContaining({
              type: 'string',
              label: 'City',
            }),
            brokerState: expect.objectContaining({
              type: 'string',
              label: 'State',
            }),
            brokerZip: expect.objectContaining({
              type: 'string',
              label: 'Zip',
            }),
          }),
        }),
      );
    });

    it('should not include address fields when includeAddress is false', async () => {
      mockQueryBuilder.execute.mockResolvedValue([]);
      dataAccess.getDaysToPayAverageMetricsByPaymentDate.mockResolvedValue([]);
      brokerService.findByIds.mockResolvedValue([]);

      const command = new BrokerAgingReportCommand({
        name: ReportName.BrokerAging,
        outputType: ReportType.CSV,
        sendTo: 'test@example.com',
        date: new Date('2026-02-22'),
        includeAddress: false,
      });

      await handler.execute(command);

      const callArgs = reportHandler.processReport.mock.calls[0];
      const formatDefinition = callArgs[3].formatDefinition as any;

      expect(formatDefinition.brokerAddress).toBeUndefined();
      expect(formatDefinition.brokerCity).toBeUndefined();
      expect(formatDefinition.brokerState).toBeUndefined();
      expect(formatDefinition.brokerZip).toBeUndefined();
    });
  });

  describe('calculateAgingBuckets', () => {
    it('should call getBrokerAgingGeneralTotal 5 times for all aging buckets', async () => {
      mockQueryBuilder.execute.mockResolvedValue([]);
      dataAccess.getDaysToPayAverageMetricsByPaymentDate.mockResolvedValue([]);
      brokerService.findByIds.mockResolvedValue([]);

      const command = new BrokerAgingReportCommand({
        name: ReportName.BrokerAging,
        outputType: ReportType.CSV,
        sendTo: 'test@example.com',
        date: new Date('2026-02-22'),
        includeAddress: false,
      });

      await handler.execute(command);

      // Should be called 5 times: current, 0-30, 31-60, 61-90, 91+
      expect(mockQueryBuilder.execute).toHaveBeenCalledTimes(5);
    });

    it('should aggregate totals by broker correctly', async () => {
      mockQueryBuilder.execute
        .mockResolvedValueOnce([
          { broker_id: 'broker-1', total: '5000' },
          { broker_id: 'broker-2', total: '3000' },
        ])
        .mockResolvedValueOnce([
          { broker_id: 'broker-1', total: '10000' },
          { broker_id: 'broker-2', total: '7000' },
        ])
        .mockResolvedValueOnce([{ broker_id: 'broker-1', total: '8000' }])
        .mockResolvedValueOnce([{ broker_id: 'broker-2', total: '2000' }])
        .mockResolvedValueOnce([{ broker_id: 'broker-1', total: '1000' }]);

      dataAccess.getDaysToPayAverageMetricsByPaymentDate.mockResolvedValue([
        {
          brokerId: 'broker-1',
          metrics: new TimeRangeMetrics({
            last30Days: new Big(15),
            last60Days: new Big(20),
            last90Days: new Big(25),
          }),
        },
        {
          brokerId: 'broker-2',
          metrics: new TimeRangeMetrics({
            last30Days: new Big(10),
            last60Days: new Big(12),
            last90Days: new Big(14),
          }),
        },
      ]);

      const broker1 = buildStubBroker({
        id: 'broker-1',
        legalName: 'Broker One',
      });
      const broker2 = buildStubBroker({
        id: 'broker-2',
        legalName: 'Broker Two',
      });

      brokerService.findByIds.mockResolvedValue([broker1, broker2]);

      const command = new BrokerAgingReportCommand({
        name: ReportName.BrokerAging,
        outputType: ReportType.CSV,
        sendTo: 'test@example.com',
        date: new Date('2026-02-22'),
        includeAddress: false,
      });

      await handler.execute(command);

      expect(brokerService.findByIds).toHaveBeenCalledWith([
        'broker-1',
        'broker-2',
      ]);
    });

    it('should fetch days to pay metrics for all brokers', async () => {
      mockQueryBuilder.execute.mockResolvedValue([
        { broker_id: 'broker-1', total: '10000' },
        { broker_id: 'broker-2', total: '5000' },
      ]);

      const getDaysToPaySpy = jest
        .spyOn(dataAccess, 'getDaysToPayAverageMetricsByPaymentDate')
        .mockResolvedValue([
          {
            brokerId: 'broker-1',
            metrics: new TimeRangeMetrics({
              last30Days: new Big(15),
              last60Days: new Big(20),
              last90Days: new Big(25),
            }),
          },
          {
            brokerId: 'broker-2',
            metrics: new TimeRangeMetrics({
              last30Days: new Big(10),
              last60Days: new Big(12),
              last90Days: new Big(14),
            }),
          },
        ]);

      brokerService.findByIds.mockResolvedValue([
        buildStubBroker({ id: 'broker-1' }),
        buildStubBroker({ id: 'broker-2' }),
      ]);

      const command = new BrokerAgingReportCommand({
        name: ReportName.BrokerAging,
        outputType: ReportType.CSV,
        sendTo: 'test@example.com',
        date: new Date('2026-02-22'),
        includeAddress: false,
      });

      await handler.execute(command);

      expect(getDaysToPaySpy).toHaveBeenCalledWith(['broker-1', 'broker-2']);
    });

    it('should set daysToPayLast30Days to N/A when value is 0', async () => {
      mockQueryBuilder.execute.mockResolvedValue([
        { broker_id: 'broker-1', total: '10000' },
      ]);

      dataAccess.getDaysToPayAverageMetricsByPaymentDate.mockResolvedValue([
        {
          brokerId: 'broker-1',
          metrics: new TimeRangeMetrics({
            last30Days: new Big(0),
            last60Days: new Big(0),
            last90Days: new Big(0),
          }),
        },
      ]);

      const stubBroker = buildStubBroker({
        id: 'broker-1',
        legalName: 'Test Broker',
      });

      brokerService.findByIds.mockResolvedValue([stubBroker]);

      // Capture the stream data before it's passed to processReport
      const capturedRows: any[] = [];
      reportHandler.processReport.mockImplementationOnce(
        async (_type, _name, dataStream) => {
          for await (const row of dataStream) {
            capturedRows.push(row);
          }
          return Readable.from([]);
        },
      );

      const command = new BrokerAgingReportCommand({
        name: ReportName.BrokerAging,
        outputType: ReportType.CSV,
        sendTo: 'test@example.com',
        date: new Date('2026-02-22'),
        includeAddress: false,
      });

      await handler.execute(command);

      expect(capturedRows[0].daysToPayLast30Days).toBe('N/A');
    });

    it('should round days to pay to nearest integer', async () => {
      mockQueryBuilder.execute.mockResolvedValue([
        { broker_id: 'broker-1', total: '10000' },
      ]);

      dataAccess.getDaysToPayAverageMetricsByPaymentDate.mockResolvedValue([
        {
          brokerId: 'broker-1',
          metrics: new TimeRangeMetrics({
            last30Days: new Big(15.7),
            last60Days: new Big(20.3),
            last90Days: new Big(25.5),
          }),
        },
      ]);

      const stubBroker = buildStubBroker({
        id: 'broker-1',
        legalName: 'Test Broker',
      });

      brokerService.findByIds.mockResolvedValue([stubBroker]);

      const capturedRows: any[] = [];
      reportHandler.processReport.mockImplementationOnce(
        async (_type, _name, dataStream) => {
          for await (const row of dataStream) {
            capturedRows.push(row);
          }
          return Readable.from([]);
        },
      );

      const command = new BrokerAgingReportCommand({
        name: ReportName.BrokerAging,
        outputType: ReportType.CSV,
        sendTo: 'test@example.com',
        date: new Date('2026-02-22'),
        includeAddress: false,
      });

      await handler.execute(command);

      expect(capturedRows[0].daysToPayLast30Days).toBe('16');
    });
  });

  describe('toReportRows', () => {
    it('should add totals row at the end', async () => {
      mockQueryBuilder.execute
        .mockResolvedValueOnce([{ broker_id: 'broker-1', total: '10000' }])
        .mockResolvedValueOnce([{ broker_id: 'broker-1', total: '5000' }])
        .mockResolvedValueOnce([{ broker_id: 'broker-1', total: '3000' }])
        .mockResolvedValueOnce([{ broker_id: 'broker-1', total: '2000' }])
        .mockResolvedValueOnce([{ broker_id: 'broker-1', total: '1000' }]);

      dataAccess.getDaysToPayAverageMetricsByPaymentDate.mockResolvedValue([
        {
          brokerId: 'broker-1',
          metrics: new TimeRangeMetrics({
            last30Days: new Big(15),
            last60Days: new Big(20),
            last90Days: new Big(25),
          }),
        },
      ]);

      const stubBroker = buildStubBroker({
        id: 'broker-1',
        legalName: 'Test Broker',
      });

      brokerService.findByIds.mockResolvedValue([stubBroker]);

      const capturedRows: any[] = [];
      reportHandler.processReport.mockImplementationOnce(
        async (_type, _name, dataStream) => {
          for await (const row of dataStream) {
            capturedRows.push(row);
          }
          return Readable.from([]);
        },
      );

      const command = new BrokerAgingReportCommand({
        name: ReportName.BrokerAging,
        outputType: ReportType.CSV,
        sendTo: 'test@example.com',
        date: new Date('2026-02-22'),
        includeAddress: false,
      });

      await handler.execute(command);

      expect(capturedRows.length).toBe(2); // 1 broker + 1 totals row
      expect(capturedRows[1].brokerName).toBe('Total');
      expect(capturedRows[1].daysToPayLast30Days).toBe('N/A');
    });

    it('should sum all aging buckets in totals row', async () => {
      mockQueryBuilder.execute
        .mockResolvedValueOnce([
          { broker_id: 'broker-1', total: '10000' },
          { broker_id: 'broker-2', total: '5000' },
        ])
        .mockResolvedValueOnce([
          { broker_id: 'broker-1', total: '8000' },
          { broker_id: 'broker-2', total: '4000' },
        ])
        .mockResolvedValueOnce([
          { broker_id: 'broker-1', total: '6000' },
          { broker_id: 'broker-2', total: '3000' },
        ])
        .mockResolvedValueOnce([
          { broker_id: 'broker-1', total: '4000' },
          { broker_id: 'broker-2', total: '2000' },
        ])
        .mockResolvedValueOnce([
          { broker_id: 'broker-1', total: '2000' },
          { broker_id: 'broker-2', total: '1000' },
        ]);

      dataAccess.getDaysToPayAverageMetricsByPaymentDate.mockResolvedValue([
        {
          brokerId: 'broker-1',
          metrics: new TimeRangeMetrics({
            last30Days: new Big(15),
            last60Days: new Big(20),
            last90Days: new Big(25),
          }),
        },
        {
          brokerId: 'broker-2',
          metrics: new TimeRangeMetrics({
            last30Days: new Big(10),
            last60Days: new Big(12),
            last90Days: new Big(14),
          }),
        },
      ]);

      brokerService.findByIds.mockResolvedValue([
        buildStubBroker({ id: 'broker-1' }),
        buildStubBroker({ id: 'broker-2' }),
      ]);

      const capturedRows: any[] = [];
      reportHandler.processReport.mockImplementationOnce(
        async (_type, _name, dataStream) => {
          for await (const row of dataStream) {
            capturedRows.push(row);
          }
          return Readable.from([]);
        },
      );

      const command = new BrokerAgingReportCommand({
        name: ReportName.BrokerAging,
        outputType: ReportType.CSV,
        sendTo: 'test@example.com',
        date: new Date('2026-02-22'),
        includeAddress: false,
      });

      await handler.execute(command);

      const totalsRow = capturedRows[capturedRows.length - 1];
      expect(totalsRow.totalPurchased0To30Days.toString()).toBe('12000');
      expect(totalsRow.totalPurchased31To60Days.toString()).toBe('9000');
      expect(totalsRow.totalPurchased61To90Days.toString()).toBe('6000');
      expect(totalsRow.totalPurchasedOver91Days.toString()).toBe('3000');
      expect(totalsRow.totalInvoices.toString()).toBe('15000');
    });

    it('should include broker address when includeAddress is true', async () => {
      mockQueryBuilder.execute.mockResolvedValue([
        { broker_id: 'broker-1', total: '10000' },
      ]);

      dataAccess.getDaysToPayAverageMetricsByPaymentDate.mockResolvedValue([
        {
          brokerId: 'broker-1',
          metrics: new TimeRangeMetrics({
            last30Days: new Big(15),
            last60Days: new Big(20),
            last90Days: new Big(25),
          }),
        },
      ]);

      const stubBroker = buildStubBroker({
        id: 'broker-1',
        legalName: 'Test Broker',
        addresses: [
          {
            type: BrokerAddressType.Office,
            address: '123 Main St',
            city: 'New York',
            state: 'NY',
            zip: '10001',
          } as BrokerAddress,
        ],
      });

      brokerService.findByIds.mockResolvedValue([stubBroker]);

      const capturedRows: any[] = [];
      reportHandler.processReport.mockImplementationOnce(
        async (_type, _name, dataStream) => {
          for await (const row of dataStream) {
            capturedRows.push(row);
          }
          return Readable.from([]);
        },
      );

      const command = new BrokerAgingReportCommand({
        name: ReportName.BrokerAging,
        outputType: ReportType.CSV,
        sendTo: 'test@example.com',
        date: new Date('2026-02-22'),
        includeAddress: true,
      });

      await handler.execute(command);

      expect(capturedRows[0].brokerAddress).toBe('123 Main St');
      expect(capturedRows[0].brokerCity).toBe('New York');
      expect(capturedRows[0].brokerState).toBe('NY');
      expect(capturedRows[0].brokerZip).toBe('10001');
    });
  });

  describe('getMetadataRow', () => {
    it('should include report date and run date in metadata', async () => {
      mockQueryBuilder.execute.mockResolvedValue([]);
      dataAccess.getDaysToPayAverageMetricsByPaymentDate.mockResolvedValue([]);
      brokerService.findByIds.mockResolvedValue([]);

      const command = new BrokerAgingReportCommand({
        name: ReportName.BrokerAging,
        outputType: ReportType.CSV,
        sendTo: 'test@example.com',
        date: new Date('2026-02-22'),
        includeAddress: false,
      });

      await handler.execute(command);

      expect(reportHandler.processReport).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          metadataRow: expect.stringContaining('Broker Aging Report'),
        }),
      );
    });
  });

  describe('getBrokerAgingGeneralTotal', () => {
    it('should query with correct date ranges and filters', async () => {
      mockQueryBuilder.execute.mockResolvedValue([]);
      dataAccess.getDaysToPayAverageMetricsByPaymentDate.mockResolvedValue([]);
      brokerService.findByIds.mockResolvedValue([]);

      const command = new BrokerAgingReportCommand({
        name: ReportName.BrokerAging,
        outputType: ReportType.CSV,
        sendTo: 'test@example.com',
        date: new Date('2026-02-22'),
        includeAddress: false,
      });

      await handler.execute(command);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        expect.objectContaining({
          recordStatus: RecordStatus.Active,
          purchasedDate: expect.any(Object),
          $or: expect.arrayContaining([
            expect.objectContaining({
              paymentDate: expect.any(Object),
            }),
            expect.objectContaining({
              paymentDate: { $eq: null },
            }),
          ]),
        }),
      );
    });

    it('should group results by broker_id', async () => {
      mockQueryBuilder.execute.mockResolvedValue([]);
      dataAccess.getDaysToPayAverageMetricsByPaymentDate.mockResolvedValue([]);
      brokerService.findByIds.mockResolvedValue([]);

      const command = new BrokerAgingReportCommand({
        name: ReportName.BrokerAging,
        outputType: ReportType.CSV,
        sendTo: 'test@example.com',
        date: new Date('2026-02-22'),
        includeAddress: false,
      });

      await handler.execute(command);

      expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith('i.broker_id');
    });
  });
});
