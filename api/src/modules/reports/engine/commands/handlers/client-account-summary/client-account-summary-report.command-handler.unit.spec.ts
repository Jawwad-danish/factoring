import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'stream';
import { ClientService } from '@module-clients';
import {
  Repositories,
  InvoiceRepository,
  ReserveRepository,
} from '@module-persistence/repositories';
import {
  InvoiceEntity,
  ReportName,
  ReserveEntity,
} from '@module-persistence/entities';
import { ReportType } from '@fs-bobtail/factoring/data';
import { ClientAccountSummaryReportCommand } from '../../client-account-summary-report.command';
import { ReportHandler } from '../report-handler';
import { ClientAccountSummaryReportCommandHandler } from './client-account-summary-report.command-handler';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { PassThrough } from 'stream';
import { buildStubClient } from '@module-clients/test';
import { QueryBuilder } from '@mikro-orm/postgresql';
import {
  buildStubClientAccountSummaryRequest,
  captureStreamRows,
} from '@module-reports';
import { ClientAccountSummaryDataAccess } from '../../../client-account-summary.data-access';

const transformMock = new PassThrough();

describe('ClientAccountSummaryReportCommandHandler', () => {
  let handler: ClientAccountSummaryReportCommandHandler;
  const clientService = createMock<ClientService>();
  const reportHandler = createMock<ReportHandler>();
  const invoiceRepository = createMock<InvoiceRepository>();
  const reserveRepository = createMock<ReserveRepository>();
  const clientAccountSummaryDataAccess =
    createMock<ClientAccountSummaryDataAccess>();

  const repositories = createMock<Repositories>({
    invoice: invoiceRepository,
    reserve: reserveRepository,
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    reportHandler.processReport.mockResolvedValue(transformMock);
    clientService.findByIds.mockResolvedValue([
      buildStubClient({
        id: 'client-1',
        name: 'Test Client',
        mc: 'MC123',
        dot: 'DOT456',
      }),
    ]);

    const mockInvoiceQueryBuilder = createMock();
    mockInvoiceQueryBuilder['select'].mockReturnThis();
    mockInvoiceQueryBuilder['where'].mockReturnThis();
    mockInvoiceQueryBuilder['groupBy'].mockReturnThis();
    mockInvoiceQueryBuilder['execute'].mockResolvedValue([
      {
        client_id: 'client-1',
        days_0_to_30: 1000,
        days_31_to_60: 500,
        days_61_to_90: 300,
        days_91_plus: 200,
        factor_fees_total: 100,
      },
    ]);

    invoiceRepository.readOnlyQueryBuilder.mockReturnValue(
      mockInvoiceQueryBuilder as QueryBuilder<InvoiceEntity>,
    );

    const mockReserveQueryBuilder = createMock();
    mockReserveQueryBuilder['select'].mockReturnThis();
    mockReserveQueryBuilder['where'].mockReturnThis();
    mockReserveQueryBuilder['groupBy'].mockReturnThis();
    mockReserveQueryBuilder['execute'].mockResolvedValue([
      {
        client_id: 'client-1',
        total: 250,
      },
    ]);

    reserveRepository.readOnlyQueryBuilder.mockReturnValue(
      mockReserveQueryBuilder as QueryBuilder<ReserveEntity>,
    );

    clientAccountSummaryDataAccess.getData.mockResolvedValue(
      new Map([
        [
          'client-1',
          {
            clientId: 'client-1',
            days0to30: 1000,
            days31to60: 500,
            days61to90: 300,
            days91plus: 200,
            factorFeesTotal: 100,
            reservesTotal: 250,
          },
        ],
      ]),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientAccountSummaryReportCommandHandler,
        Repositories,
        mockMikroORMProvider,
        {
          provide: ClientService,
          useValue: clientService,
        },
        {
          provide: ReportHandler,
          useValue: reportHandler,
        },
        {
          provide: Repositories,
          useValue: repositories,
        },
        {
          provide: ClientAccountSummaryDataAccess,
          useValue: clientAccountSummaryDataAccess,
        },
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    handler = module.get<ClientAccountSummaryReportCommandHandler>(
      ClientAccountSummaryReportCommandHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should execute client account summary report command', async () => {
    const processReportSpy = reportHandler.processReport.mockResolvedValueOnce(
      Readable.from([]),
    );
    const command = new ClientAccountSummaryReportCommand(
      buildStubClientAccountSummaryRequest(),
    );

    await handler.execute(command);

    expect(processReportSpy).toHaveBeenCalledTimes(1);
    expect(processReportSpy).toHaveBeenCalledWith(
      ReportType.CSV,
      ReportName.ClientAccountSummary,
      expect.any(Readable),
      expect.objectContaining({
        formatDefinition: expect.any(Object),
        metadataRow: expect.any(String),
      }),
    );
  });

  it('should fetch client account summary data with correct date', async () => {
    const dataAccessSpy = jest.spyOn(clientAccountSummaryDataAccess, 'getData');
    const command = new ClientAccountSummaryReportCommand(
      buildStubClientAccountSummaryRequest({
        date: new Date('2025-02-15'),
      }),
    );

    await handler.execute(command);

    expect(dataAccessSpy).toHaveBeenCalledTimes(1);
    expect(dataAccessSpy).toHaveBeenCalledWith(new Date('2025-02-15'));
  });

  it('should fetch clients by ids', async () => {
    const clientServiceSpy = jest.spyOn(clientService, 'findByIds');
    const command = new ClientAccountSummaryReportCommand(
      buildStubClientAccountSummaryRequest(),
    );

    await handler.execute(command);

    expect(clientServiceSpy).toHaveBeenCalledTimes(1);
    expect(clientServiceSpy).toHaveBeenCalledWith(['client-1']);
  });

  it('should calculate total invoices and total AR correctly', async () => {
    const command = new ClientAccountSummaryReportCommand(
      buildStubClientAccountSummaryRequest(),
    );

    await handler.execute(command);

    expect(reportHandler.processReport).toHaveBeenCalledWith(
      ReportType.CSV,
      ReportName.ClientAccountSummary,
      expect.any(Readable),
      expect.objectContaining({
        formatDefinition: expect.objectContaining({
          clientName: expect.objectContaining({ type: 'string' }),
          clientMC: expect.objectContaining({ type: 'string' }),
          clientDOT: expect.objectContaining({ type: 'string' }),
          accountManagerName: expect.objectContaining({ type: 'string' }),
          days0to30: expect.objectContaining({ type: 'currency' }),
          days31to60: expect.objectContaining({ type: 'currency' }),
          days61to90: expect.objectContaining({ type: 'currency' }),
          days91plus: expect.objectContaining({ type: 'currency' }),
          totalInvoices: expect.objectContaining({ type: 'currency' }),
          totalFees: expect.objectContaining({ type: 'currency' }),
          totalReserve: expect.objectContaining({ type: 'currency' }),
          totalAR: expect.objectContaining({ type: 'currency' }),
        }),
      }),
    );
  });

  it('should include totals row in report', async () => {
    clientAccountSummaryDataAccess.getData.mockResolvedValue(
      new Map([
        [
          'client-1',
          {
            clientId: 'client-1',
            days0to30: 1000,
            days31to60: 500,
            days61to90: 300,
            days91plus: 200,
            factorFeesTotal: 100,
            reservesTotal: 250,
          },
        ],
        [
          'client-2',
          {
            clientId: 'client-2',
            days0to30: 2000,
            days31to60: 1000,
            days61to90: 600,
            days91plus: 400,
            factorFeesTotal: 200,
            reservesTotal: 500,
          },
        ],
      ]),
    );
    clientService.findByIds.mockResolvedValue([
      buildStubClient({ id: 'client-1', name: 'Client 1' }),
      buildStubClient({ id: 'client-2', name: 'Client 2' }),
    ]);

    const command = new ClientAccountSummaryReportCommand(
      buildStubClientAccountSummaryRequest(),
    );

    reportHandler.processReport.mockImplementationOnce(
      async (_type, _name, stream) => stream,
    );

    const resultStream = await handler.execute(command);

    const rows = await captureStreamRows<any>(resultStream);

    expect(rows.length).toBe(3);
    expect(rows[2].clientName).toBe('Totals');
    expect(rows[2].days0to30.toNumber()).toBe(3000);
    expect(rows[2].days31to60.toNumber()).toBe(1500);
    expect(rows[2].days61to90.toNumber()).toBe(900);
    expect(rows[2].days91plus.toNumber()).toBe(600);
    expect(rows[2].totalFees.toNumber()).toBe(300);
    expect(rows[2].totalReserve.toNumber()).toBe(750);
  });
});
