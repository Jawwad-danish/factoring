import { mockToken } from '@core/test';
import { PortfolioReportRequest, ReportType } from '@fs-bobtail/factoring/data';
import { createMock } from '@golevelup/ts-jest';
import { ClientService } from '@module-clients';
import { buildStubClient } from '@module-clients/test';
import { ReportName } from '@module-persistence/entities';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import { PassThrough, Readable } from 'stream';
import { PortfolioReportCommand } from '../../portfolio-report.command';
import { ReportsDataAccess } from '../../../reports.data-access';
import { ReportHandler } from '../report-handler';
import { PortfolioReportCommandHandler } from './portfolio-report.command-handler';

const transformMock = new PassThrough();

const readStreamToArray = async <T>(stream: Readable): Promise<T[]> => {
  const rows: T[] = [];
  for await (const chunk of stream as any as AsyncIterable<T>) {
    rows.push(chunk);
  }
  return rows;
};

describe('PortfolioReportCommandHandler', () => {
  let handler: PortfolioReportCommandHandler;

  const reportHandler = createMock<ReportHandler>();
  const clientService = createMock<ClientService>();
  const reportsDataAccess = createMock<ReportsDataAccess>();

  beforeEach(async () => {
    jest.clearAllMocks();

    reportHandler.processReport.mockResolvedValue(transformMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioReportCommandHandler,
        {
          provide: ReportHandler,
          useValue: reportHandler,
        },
        {
          provide: ClientService,
          useValue: clientService,
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

    handler = module.get<PortfolioReportCommandHandler>(
      PortfolioReportCommandHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should execute portfolio report command', async () => {
    const startDate = new Date('2026-01-01');
    const endDate = new Date('2026-01-31');

    reportsDataAccess.getPortfolioClientsInvoiceAgg.mockResolvedValue([
      {
        client_id: 'client-1',
        start_date: new Date('2025-01-01'),
        total_factor: '1000',
        total_fee: '50',
      },
    ]);

    clientService.findByIds.mockResolvedValue([
      buildStubClient({
        id: 'client-1',
        name: 'Acme LLC',
        mc: 'MC123',
        dot: 'DOT456',
      }),
    ]);

    reportsDataAccess.getDilutionRatesByClientIds.mockResolvedValue({
      'client-1': { dilution: 1.23, adjDilution: 2.34 },
    });

    const command = new PortfolioReportCommand({
      outputType: ReportType.CSV,
      startDate,
      endDate,
    } as any as PortfolioReportRequest);

    await handler.execute(command);

    expect(reportHandler.processReport).toHaveBeenCalledWith(
      ReportType.CSV,
      ReportName.Portfolio,
      expect.any(Readable),
      expect.objectContaining({
        formatDefinition: expect.any(Object),
        metadataRow: expect.stringContaining('Portfolio Report'),
      }),
    );

    expect(
      reportsDataAccess.getPortfolioClientsInvoiceAgg,
    ).toHaveBeenCalledWith(startDate, endDate);
    expect(clientService.findByIds).toHaveBeenCalledWith(['client-1']);
    expect(reportsDataAccess.getDilutionRatesByClientIds).toHaveBeenCalledWith(
      startDate,
      endDate,
      ['client-1'],
    );
  });

  it('should transform data into report rows', async () => {
    const startDate = new Date('2026-01-01');
    const endDate = new Date('2026-01-31');

    reportsDataAccess.getPortfolioClientsInvoiceAgg.mockResolvedValue([
      {
        client_id: 'client-1',
        start_date: new Date('2025-01-01'),
        total_factor: '1000',
        total_fee: '50',
      },
    ]);

    clientService.findByIds.mockResolvedValue([
      buildStubClient({
        id: 'client-1',
        name: 'Acme LLC',
        mc: 'MC123',
        dot: 'DOT456',
        clientContacts: [],
      }),
    ]);

    reportsDataAccess.getDilutionRatesByClientIds.mockResolvedValue({
      'client-1': { dilution: 1.23, adjDilution: 2.34 },
    });

    const stream = await handler.getReportDataStream({
      outputType: ReportType.CSV,
      startDate,
      endDate,
    } as any as PortfolioReportRequest);

    const rows = await readStreamToArray<any>(stream);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual(
      expect.objectContaining({
        clientName: 'Acme LLC',
        clientMC: 'mc1',
        clientDOT: 'dot1',
        state: 'CA',
        verification: 'No',
        dilution: '1.23',
        AdjDilution: '2.34',
      }),
    );

    expect(rows[0].totalFactored).toBeInstanceOf(Big);
    expect(rows[0].fees).toBeInstanceOf(Big);
    expect(rows[0].totalFactored.toString()).toBe('1000');
    expect(rows[0].fees.toString()).toBe('50');
  });
});
