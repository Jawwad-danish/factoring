import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'stream';
import { ReportType } from '@fs-bobtail/factoring/data';
import { ReportHandler } from '../report-handler';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { PassThrough } from 'stream';
import { VolumeReportCommandHandler } from './volume-report.command-handler';
import { VolumeReportCommand } from '../../volume-report.command';
import { ClientApi, LightweightClient } from '@module-clients';
import { ReportName } from '@module-persistence';
import { ReportsDataAccess } from '../../../reports.data-access';
import { buildStubLightweightClient } from '@module-clients/test';

const transformMock = new PassThrough();

describe('VolumeReportCommandHandler', () => {
  let handler: VolumeReportCommandHandler;
  const reportHandler = createMock<ReportHandler>();
  const clientApi = createMock<ClientApi>();
  const reportsDataAccess = createMock<ReportsDataAccess>();

  const mockClients: LightweightClient[] = [
    buildStubLightweightClient({
      id: 'client-1',
      name: 'Test Client 1',
      mc: 'MC123',
      dot: 'DOT456',
    }),
    buildStubLightweightClient({
      id: 'client-2',
      name: 'Test Client 2',
      mc: 'MC789',
      dot: 'DOT012',
    }),
  ];

  beforeEach(async () => {
    jest.clearAllMocks();

    reportHandler.processReport.mockResolvedValue(transformMock);
    clientApi.getAllClients.mockResolvedValue(mockClients);

    const mockInvoiceDataMap = new Map([
      [
        'client-1',
        {
          client_id: 'client-1',
          ar_total: '1000000',
          factor_fees_total: '30000',
        },
      ],
    ]);
    reportsDataAccess.getVolumeReportInvoiceData.mockResolvedValue(
      mockInvoiceDataMap,
    );

    const mockStream = {
      pipeline: jest.fn().mockReturnValue(Readable.from([])),
    };
    reportsDataAccess.getAllClientFactoringConfigsWithTeamDataStream.mockResolvedValue(
      mockStream as any,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VolumeReportCommandHandler,
        mockMikroORMProvider,
        {
          provide: ReportHandler,
          useValue: reportHandler,
        },
        {
          provide: ClientApi,
          useValue: clientApi,
        },
        {
          provide: ReportsDataAccess,
          useValue: reportsDataAccess,
        },
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    handler = module.get<VolumeReportCommandHandler>(
      VolumeReportCommandHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should return correct report name', () => {
    expect(handler.getName()).toBe(ReportName.Volume);
  });

  it('should execute volume report command', async () => {
    const processReportSpy = reportHandler.processReport.mockResolvedValueOnce(
      Readable.from([]),
    );
    const command = new VolumeReportCommand({
      name: ReportName.Volume,
      outputType: ReportType.CSV,
      sendTo: 'test@example.com',
      startDate: new Date('2026-01-31'),
      endDate: new Date('2026-02-16'),
    });

    await handler.execute(command);

    expect(processReportSpy).toHaveBeenCalledTimes(1);
    expect(processReportSpy).toHaveBeenCalledWith(
      ReportType.CSV,
      ReportName.Volume,
      expect.any(Readable),
      expect.objectContaining({
        formatDefinition: expect.any(Object),
        metadataRow: expect.any(String),
      }),
    );
  });

  it('should fetch all clients', async () => {
    const getAllClientsSpy = jest.spyOn(clientApi, 'getAllClients');
    const command = new VolumeReportCommand({
      name: ReportName.Volume,
      outputType: ReportType.CSV,
      sendTo: 'test@example.com',
      startDate: new Date('2026-01-31'),
      endDate: new Date('2026-02-16'),
    });

    await handler.execute(command);

    expect(getAllClientsSpy).toHaveBeenCalledTimes(1);
  });

  it('should fetch invoice data with correct date range', async () => {
    const startDate = new Date('2026-01-31');
    const endDate = new Date('2026-02-16');
    const getInvoiceDataSpy = jest.spyOn(
      reportsDataAccess,
      'getVolumeReportInvoiceData',
    );

    const command = new VolumeReportCommand({
      name: ReportName.Volume,
      outputType: ReportType.CSV,
      sendTo: 'test@example.com',
      startDate,
      endDate,
    });

    await handler.execute(command);

    expect(getInvoiceDataSpy).toHaveBeenCalledTimes(1);
    expect(getInvoiceDataSpy).toHaveBeenCalledWith(startDate, endDate);
  });

  it('should fetch factoring configs stream', async () => {
    const getFactoringConfigsSpy = jest.spyOn(
      reportsDataAccess,
      'getAllClientFactoringConfigsWithTeamDataStream',
    );
    const command = new VolumeReportCommand({
      name: ReportName.Volume,
      outputType: ReportType.CSV,
      sendTo: 'test@example.com',
      startDate: new Date('2026-01-31'),
      endDate: new Date('2026-02-16'),
    });

    await handler.execute(command);

    expect(getFactoringConfigsSpy).toHaveBeenCalledTimes(1);
  });

  it('should create client data map from all clients', async () => {
    const command = new VolumeReportCommand({
      name: ReportName.Volume,
      outputType: ReportType.CSV,
      sendTo: 'test@example.com',
      startDate: new Date('2026-01-31'),
      endDate: new Date('2026-02-16'),
    });

    await handler.execute(command);

    expect(clientApi.getAllClients).toHaveBeenCalled();
    expect(
      reportsDataAccess.getAllClientFactoringConfigsWithTeamDataStream,
    ).toHaveBeenCalled();
  });

  it('should provide the correct format definition to report handler', async () => {
    const command = new VolumeReportCommand({
      name: ReportName.Volume,
      outputType: ReportType.CSV,
      sendTo: 'test@example.com',
      startDate: new Date('2026-01-31'),
      endDate: new Date('2026-02-16'),
    });

    await handler.execute(command);

    expect(reportHandler.processReport).toHaveBeenCalledWith(
      ReportType.CSV,
      ReportName.Volume,
      expect.any(Readable),
      expect.objectContaining({
        formatDefinition: expect.objectContaining({
          clientName: expect.objectContaining({
            type: 'string',
            label: 'Client',
          }),
          accountManagerName: expect.objectContaining({
            type: 'string',
            label: 'Account Manager',
          }),
          clientMC: expect.objectContaining({
            type: 'string',
            label: 'Client MC',
          }),
          clientDOT: expect.objectContaining({
            type: 'string',
            label: 'Client DOT',
          }),
          salesperson: expect.objectContaining({
            type: 'string',
            label: 'Salesperson',
          }),
          totalInvoices: expect.objectContaining({
            type: 'currency',
            label: 'Total Invoices Purchased',
          }),
          totalFees: expect.objectContaining({
            type: 'currency',
            label: 'Total Fees',
          }),
        }),
      }),
    );
  });

  it('should include metadata row with date range', async () => {
    const command = new VolumeReportCommand({
      name: ReportName.Volume,
      outputType: ReportType.CSV,
      sendTo: 'test@example.com',
      startDate: new Date('2026-01-31'),
      endDate: new Date('2026-02-16'),
    });

    await handler.execute(command);

    expect(reportHandler.processReport).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        metadataRow: expect.stringContaining('Volume Report'),
      }),
    );
  });
});
