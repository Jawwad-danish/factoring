import { mockToken } from '@core/test';
import {
  ClientTrendsReportCreateRequest,
  ReportType,
} from '@fs-bobtail/factoring/data';
import { createMock } from '@golevelup/ts-jest';
import { ClientApi } from '@module-clients';
import { buildStubClient } from '@module-clients/test';
import { ClientFactoringConfigsRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import { Readable } from 'stream';
import { ReportName } from '../../../../../persistence';
import { ClientTrendsReportsDataAccess } from '../../../client-trends.data-access';
import { ClientTrendsReportCommand } from '../../client-trends-report.command';
import { ReportHandler } from '../report-handler';
import { ClientTrendsReportCommandHandler } from './client-trends.command-handler';

describe('ClientTrendsReportCommandHandler', () => {
  const CLIENT_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

  let handler: ClientTrendsReportCommandHandler;
  const reportHandler = createMock<ReportHandler>();
  const clientTrendsDataAccess = createMock<ClientTrendsReportsDataAccess>();
  const clientApi = createMock<ClientApi>();
  const clientFactoringConfigsRepository =
    createMock<ClientFactoringConfigsRepository>();

  beforeEach(async () => {
    jest.clearAllMocks();

    reportHandler.processReport.mockResolvedValue(Readable.from([]));

    clientTrendsDataAccess.getInvoicedAverageFeesAndYield.mockResolvedValue({
      invoiced: new Big(500000),
      averageInvoice: new Big(50000),
      factorFees: new Big(15000),
      yieldVal: new Big(3),
    });

    clientTrendsDataAccess.getReservesUntilDate.mockResolvedValue(100000);

    clientTrendsDataAccess.getInvoiceARFeesDeductionsNfeAtDate.mockResolvedValue(
      {
        invoicesAR: new Big(400000),
        totalFactorFees: new Big(12000),
        totalDeductions: new Big(8000),
        totalNfe: new Big(380000),
      },
    );

    clientTrendsDataAccess.getDilutionStats.mockResolvedValue({
      dilution: new Big(1.5),
      adjDilution: new Big(1.2),
      daysToPay: new Big(30),
      daysToPost: new Big(5),
    });

    const stubClient = buildStubClient({ id: CLIENT_ID });
    stubClient.name = 'Highway Trucks Inc';
    stubClient.mc = '999466';
    stubClient.dot = '123456';
    clientApi.findById.mockResolvedValue(stubClient);

    clientFactoringConfigsRepository.findClientSuccessTeamNameByClientId.mockResolvedValue(
      'Team 101',
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientTrendsReportCommandHandler,
        {
          provide: ReportHandler,
          useValue: reportHandler,
        },
        {
          provide: ClientTrendsReportsDataAccess,
          useValue: clientTrendsDataAccess,
        },
        {
          provide: ClientApi,
          useValue: clientApi,
        },
        {
          provide: ClientFactoringConfigsRepository,
          useValue: clientFactoringConfigsRepository,
        },
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    handler = module.get<ClientTrendsReportCommandHandler>(
      ClientTrendsReportCommandHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should execute the client trends report command', async () => {
    const request = new ClientTrendsReportCreateRequest({
      outputType: ReportType.CSV,
      sendTo: 'test@example.com',
    });
    const command = new ClientTrendsReportCommand(request);

    await handler.execute(command);

    expect(reportHandler.processReport).toHaveBeenCalledTimes(1);
    expect(reportHandler.processReport).toHaveBeenCalledWith(
      ReportType.CSV,
      ReportName.ClientTrends,
      expect.any(Readable),
      expect.objectContaining({
        formatDefinition: expect.any(Object),
        metadataRow: expect.any(String),
      }),
    );
  });

  it('should provide the correct format definition to report handler', async () => {
    const request = new ClientTrendsReportCreateRequest({
      outputType: ReportType.CSV,
      sendTo: 'test@example.com',
    });
    const command = new ClientTrendsReportCommand(request);

    await handler.execute(command);

    expect(reportHandler.processReport).toHaveBeenCalledWith(
      ReportType.CSV,
      ReportName.ClientTrends,
      expect.any(Readable),
      expect.objectContaining({
        formatDefinition: expect.objectContaining({
          monthYear: expect.objectContaining({
            type: 'string',
            label: 'Month-Year',
          }),
          monthlyInvoices: expect.objectContaining({
            type: 'currency',
            label: 'Monthly Invoiced',
          }),
          averageInvoices: expect.objectContaining({
            type: 'currency',
            label: 'Average Invoice',
          }),
          monthlyFactor: expect.objectContaining({
            type: 'currency',
            label: 'Monthly Factor Fees',
          }),
          reservesAccountReceivable: expect.objectContaining({
            type: 'currency',
            label: 'Reserves A/R',
          }),
          invoiceAccountReceivable: expect.objectContaining({
            type: 'currency',
            label: 'Invoices A/R',
          }),
          totalAccountReceivable: expect.objectContaining({
            type: 'currency',
            label: 'Total A/R',
          }),
          factorFees: expect.objectContaining({
            type: 'currency',
            label: 'Factor Fees',
          }),
          deductions: expect.objectContaining({
            type: 'currency',
            label: 'Deductions',
          }),
          netFundsEmployed: expect.objectContaining({
            type: 'currency',
            label: 'Net Funds Employed',
          }),
          yield: expect.objectContaining({
            type: 'percentage',
            label: 'Yield',
          }),
          dilution: expect.objectContaining({
            type: 'percentage',
            label: 'Dilution',
          }),
          adjDilution: expect.objectContaining({
            type: 'percentage',
            label: 'Adj Dilution',
          }),
          daysToPay: expect.objectContaining({
            type: 'string',
            label: 'Days to Pay',
          }),
          daysToPost: expect.objectContaining({
            type: 'string',
            label: 'Days to Post',
          }),
        }),
      }),
    );
  });

  it('should include metadata row mentioning Client Trends Report', async () => {
    const request = new ClientTrendsReportCreateRequest({
      outputType: ReportType.CSV,
      sendTo: 'test@example.com',
    });
    const command = new ClientTrendsReportCommand(request);

    await handler.execute(command);

    expect(reportHandler.processReport).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        metadataRow: expect.stringContaining('Client Trends Report'),
      }),
    );
  });

  it('should call getInvoicedAverageFeesAndYield for each month in the 12-month window', async () => {
    const request = new ClientTrendsReportCreateRequest({
      outputType: ReportType.CSV,
      sendTo: 'test@example.com',
    });
    const command = new ClientTrendsReportCommand(request);

    await handler.execute(command);

    expect(
      clientTrendsDataAccess.getInvoicedAverageFeesAndYield,
    ).toHaveBeenCalledTimes(13);
  });

  it('should call getReservesUntilDate for each month in the 12-month window', async () => {
    const request = new ClientTrendsReportCreateRequest({
      outputType: ReportType.CSV,
      sendTo: 'test@example.com',
    });
    const command = new ClientTrendsReportCommand(request);

    await handler.execute(command);

    expect(clientTrendsDataAccess.getReservesUntilDate).toHaveBeenCalledTimes(
      13,
    );
  });

  it('should call getInvoiceARFeesDeductionsNfeAtDate for each month in the 12-month window', async () => {
    const request = new ClientTrendsReportCreateRequest({
      outputType: ReportType.CSV,
      sendTo: 'test@example.com',
    });
    const command = new ClientTrendsReportCommand(request);

    await handler.execute(command);

    expect(
      clientTrendsDataAccess.getInvoiceARFeesDeductionsNfeAtDate,
    ).toHaveBeenCalledTimes(13);
  });

  it('should call getDilutionStats for each month in the 12-month window', async () => {
    const request = new ClientTrendsReportCreateRequest({
      outputType: ReportType.CSV,
      sendTo: 'test@example.com',
    });
    const command = new ClientTrendsReportCommand(request);

    await handler.execute(command);

    expect(clientTrendsDataAccess.getDilutionStats).toHaveBeenCalledTimes(13);
  });

  it('should pass clientId to all data access calls when provided', async () => {
    const clientId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const request = new ClientTrendsReportCreateRequest({
      outputType: ReportType.CSV,
      sendTo: 'test@example.com',
      clientId,
    });
    const command = new ClientTrendsReportCommand(request);

    await handler.execute(command);

    expect(
      clientTrendsDataAccess.getInvoicedAverageFeesAndYield,
    ).toHaveBeenCalledWith(expect.any(Date), expect.any(Date), clientId);
    expect(clientTrendsDataAccess.getReservesUntilDate).toHaveBeenCalledWith(
      expect.any(Date),
      clientId,
    );
    expect(
      clientTrendsDataAccess.getInvoiceARFeesDeductionsNfeAtDate,
    ).toHaveBeenCalledWith(expect.any(Date), clientId);
    expect(clientTrendsDataAccess.getDilutionStats).toHaveBeenCalledWith(
      expect.any(Date),
      expect.any(Date),
      clientId,
    );
  });

  it('should pass null clientId to all data access calls when clientId is not provided', async () => {
    const request = new ClientTrendsReportCreateRequest({
      outputType: ReportType.CSV,
      sendTo: 'test@example.com',
    });
    const command = new ClientTrendsReportCommand(request);

    await handler.execute(command);

    expect(
      clientTrendsDataAccess.getInvoicedAverageFeesAndYield,
    ).toHaveBeenCalledWith(expect.any(Date), expect.any(Date), null);
    expect(clientTrendsDataAccess.getReservesUntilDate).toHaveBeenCalledWith(
      expect.any(Date),
      null,
    );
    expect(
      clientTrendsDataAccess.getInvoiceARFeesDeductionsNfeAtDate,
    ).toHaveBeenCalledWith(expect.any(Date), null);
    expect(clientTrendsDataAccess.getDilutionStats).toHaveBeenCalledWith(
      expect.any(Date),
      expect.any(Date),
      null,
    );
  });

  it('should return a Readable stream', async () => {
    const mockStream = Readable.from([]);
    reportHandler.processReport.mockResolvedValue(mockStream);

    const request = new ClientTrendsReportCreateRequest({
      outputType: ReportType.CSV,
      sendTo: 'test@example.com',
    });
    const command = new ClientTrendsReportCommand(request);

    const result = await handler.execute(command);

    expect(result).toBe(mockStream);
  });

  it('should not include client info in metadata row when clientId is not provided', async () => {
    const request = new ClientTrendsReportCreateRequest({
      outputType: ReportType.CSV,
      sendTo: 'test@example.com',
    });
    const command = new ClientTrendsReportCommand(request);

    await handler.execute(command);

    expect(reportHandler.processReport).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        metadataRow: expect.not.stringContaining('MC:'),
      }),
    );
  });

  it('should not call clientApi when clientId is not provided', async () => {
    const request = new ClientTrendsReportCreateRequest({
      outputType: ReportType.CSV,
      sendTo: 'test@example.com',
    });
    const command = new ClientTrendsReportCommand(request);

    await handler.execute(command);

    expect(clientApi.findById).not.toHaveBeenCalled();
  });

  it('should include client name, MC, DOT, and account manager in metadata row when clientId is provided', async () => {
    const request = new ClientTrendsReportCreateRequest({
      outputType: ReportType.CSV,
      sendTo: 'test@example.com',
      clientId: CLIENT_ID,
    });
    const command = new ClientTrendsReportCommand(request);

    await handler.execute(command);

    expect(reportHandler.processReport).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        metadataRow: expect.stringMatching(
          /Client Trends Report \/.*- Highway Trucks Inc \(MC: 999466 \/ DOT: 123456 \/ Account Manager : Team 101\)/,
        ),
      }),
    );
  });

  it('should call clientApi when clientId is provided', async () => {
    const request = new ClientTrendsReportCreateRequest({
      outputType: ReportType.CSV,
      sendTo: 'test@example.com',
      clientId: CLIENT_ID,
    });
    const command = new ClientTrendsReportCommand(request);

    await handler.execute(command);

    expect(clientApi.findById).toHaveBeenCalledWith(CLIENT_ID);
  });

  it('should fall back to N/A for client info when client is not found', async () => {
    clientApi.findById.mockResolvedValue(null);

    const request = new ClientTrendsReportCreateRequest({
      outputType: ReportType.CSV,
      sendTo: 'test@example.com',
      clientId: CLIENT_ID,
    });
    const command = new ClientTrendsReportCommand(request);

    await handler.execute(command);

    expect(reportHandler.processReport).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        metadataRow: expect.stringContaining(
          '(MC: N/A / DOT: N/A / Account Manager : Team 101)',
        ),
      }),
    );
  });
});
