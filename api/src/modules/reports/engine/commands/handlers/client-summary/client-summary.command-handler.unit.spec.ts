import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'stream';
import { ClientService } from '@module-clients';
import {
  InvoiceRepository,
  Repositories,
  ClientFactoringConfigsRepository,
  ReserveRepository,
} from '@module-persistence/repositories';
import {
  BrokerPaymentStatus,
  ClientFactoringConfigsEntity,
  InvoiceEntity,
  RecordStatus,
  ReportName,
  ReserveEntity,
  ReserveReason,
} from '@module-persistence/entities';
import { ReportType } from '@fs-bobtail/factoring/data';
import { ClientSummaryReportCommand } from '../../client-summary-report.command';
import { ReportHandler } from '../report-handler';
import { ClientSummaryReportCommandHandler } from './client-summary.command-handler';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { PassThrough } from 'stream';
import { buildStubClient } from '@module-clients/test';
import { QueryBuilder } from '@mikro-orm/postgresql';
import { InvoiceDataAccess } from '@module-invoices';
import Big from 'big.js';
import { buildStubClientSummaryRequest } from '@module-reports';
import { ReportsDataAccess } from '../../../reports.data-access';

const transformMock = new PassThrough();

describe('ClientSummaryReportCommandHandler', () => {
  let handler: ClientSummaryReportCommandHandler;
  const clientService = createMock<ClientService>();
  const reportHandler = createMock<ReportHandler>();
  const invoiceRepository = createMock<InvoiceRepository>();
  const clientFactoringConfigRepository =
    createMock<ClientFactoringConfigsRepository>();
  const reserveRepository = createMock<ReserveRepository>();
  const invoiceDataAccess = createMock<InvoiceDataAccess>();
  const reportsDataAccess = createMock<ReportsDataAccess>();

  const repositories = createMock<Repositories>({
    invoice: invoiceRepository,
    clientFactoringConfig: clientFactoringConfigRepository,
    reserve: reserveRepository,
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    reportHandler.processReport.mockResolvedValue(transformMock);
    clientService.findByIds.mockResolvedValue([
      buildStubClient({ id: 'client-1' }),
    ]);

    const mockInvoiceQueryBuilder = createMock();
    mockInvoiceQueryBuilder['select'].mockReturnThis();
    mockInvoiceQueryBuilder['leftJoinAndSelect'].mockReturnThis();
    mockInvoiceQueryBuilder['where'].mockReturnThis();
    mockInvoiceQueryBuilder['orderBy'].mockReturnThis();
    mockInvoiceQueryBuilder['groupBy'].mockReturnThis();
    mockInvoiceQueryBuilder['execute'].mockResolvedValue([
      {
        client_id: 'client-1',
        start_date: new Date('2025-01-01'),
      },
    ]);
    mockInvoiceQueryBuilder['getResultList'].mockResolvedValue([
      {
        id: 'invoice-1',
        clientId: 'client-1',
        loadNumber: 'LOAD123',
        accountsReceivableValue: new Big(1000),
        paymentDate: new Date('2025-01-15'),
        approvedFactorFee: new Big(50),
        createdAt: new Date('2025-01-05'),
        expedited: false,
        brokerPaymentStatus: BrokerPaymentStatus.InFull,
        brokerPayments: [
          {
            id: 'payment-1',
            amount: new Big(1000),
            batchDate: new Date('2025-01-10'),
            recordStatus: RecordStatus.Active,
          },
        ],
      },
    ]);

    invoiceRepository.readOnlyQueryBuilder.mockReturnValue(
      mockInvoiceQueryBuilder as QueryBuilder<InvoiceEntity>,
    );

    reportsDataAccess.resolveDilutionStatsBetweenRange.mockResolvedValue(
      new Map([
        [
          'client-1',
          {
            dilution: new Big(1),
            adjDilution: new Big(1),
            daysToPay: new Big(2),
          },
        ],
      ]),
    );

    const mockClientFactoringConfigQueryBuilder = createMock();
    mockClientFactoringConfigQueryBuilder['select'].mockReturnThis();
    mockClientFactoringConfigQueryBuilder['leftJoinAndSelect'].mockReturnThis();
    mockClientFactoringConfigQueryBuilder['where'].mockReturnThis();
    mockClientFactoringConfigQueryBuilder['getResultList'].mockResolvedValue([
      {
        id: 'config-1',
        clientId: 'client-1',
        createdAt: new Date(),
        status: 'Active',
        requiresVerification: false,
        factoringRatePercentage: new Big(2.25),
        clientSuccessTeam: {
          id: 'team-1',
          name: 'Team A',
        },
        salesRep: {
          id: 'sales-1',
          user: {
            getFullName: () => 'John Doe',
          },
        },
      },
    ]);

    clientFactoringConfigRepository.readOnlyQueryBuilder.mockReturnValue(
      mockClientFactoringConfigQueryBuilder as QueryBuilder<ClientFactoringConfigsEntity>,
    );

    const mockReserveQueryBuilder = createMock();
    mockReserveQueryBuilder['select'].mockReturnThis();
    mockReserveQueryBuilder['where'].mockReturnThis();
    mockReserveQueryBuilder['groupBy'].mockReturnThis();
    mockReserveQueryBuilder['execute'].mockResolvedValue([
      {
        client_id: 'client-1',
        reason: ReserveReason.Shortpay,
        total: 50,
      },
      {
        client_id: 'client-1',
        reason: ReserveReason.ClientCredit,
        total: 25,
      },
    ]);

    reserveRepository.readOnlyQueryBuilder.mockReturnValue(
      mockReserveQueryBuilder as QueryBuilder<ReserveEntity>,
    );

    repositories.execute.mockImplementation((query) => {
      if (query.includes('batch_date - i.purchased_date')) {
        return Promise.resolve([{ days: 5 }]);
      } else if (query.includes('leftToPay')) {
        return Promise.resolve([{ total: 1000, leftToPay: 50 }]);
      }
      return Promise.resolve([]);
    });

    invoiceDataAccess.getClientsAgingGeneralTotal.mockResolvedValue(
      new Map([
        [
          'client-1',
          {
            totalAr: new Big(2000),
            netFundsEmployed: new Big(1900),
          },
        ],
      ]),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientSummaryReportCommandHandler,
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
          provide: InvoiceDataAccess,
          useValue: invoiceDataAccess,
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

    handler = module.get<ClientSummaryReportCommandHandler>(
      ClientSummaryReportCommandHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should execute client summary report command', async () => {
    const processReportSpy = reportHandler.processReport.mockResolvedValueOnce(
      Readable.from([]),
    );
    const queryBuilderSpy = jest.spyOn(
      repositories.invoice,
      'readOnlyQueryBuilder',
    );
    const command = new ClientSummaryReportCommand(
      buildStubClientSummaryRequest(),
    );

    await handler.execute(command);

    expect(processReportSpy).toHaveBeenCalledTimes(1);
    expect(processReportSpy).toHaveBeenCalledWith(
      ReportType.CSV,
      ReportName.ClientSummary,
      expect.any(Readable),
      expect.objectContaining({
        formatDefinition: expect.any(Object),
      }),
    );
    expect(queryBuilderSpy).toHaveBeenCalledWith('i');
    expect(queryBuilderSpy).toHaveBeenCalledTimes(2);
  });

  it('should fetch client factoring configs', async () => {
    const queryBuilderSpy = jest.spyOn(
      repositories.clientFactoringConfig,
      'readOnlyQueryBuilder',
    );
    const command = new ClientSummaryReportCommand(
      buildStubClientSummaryRequest(),
    );

    await handler.execute(command);

    expect(queryBuilderSpy).toHaveBeenCalledWith('cfc');
    expect(queryBuilderSpy).toHaveBeenCalledTimes(1);
  });

  it('should fetch reserves by reasons for clients', async () => {
    const queryBuilderSpy = jest.spyOn(
      repositories.reserve,
      'readOnlyQueryBuilder',
    );
    const command = new ClientSummaryReportCommand(
      buildStubClientSummaryRequest(),
    );

    await handler.execute(command);

    expect(queryBuilderSpy).toHaveBeenCalledWith('r');
    expect(queryBuilderSpy).toHaveBeenCalledTimes(1);
  });

  it('should call getClientDaysToPayBetweenRange with correct parameters', async () => {
    const reserves = [
      { client_id: 'client-1', reason: ReserveReason.Shortpay, total: 50 },
      {
        client_id: 'client-1',
        reason: ReserveReason.ClientCredit,
        total: 25,
      },
    ];
    const executeSpy = jest.spyOn(
      reportsDataAccess,
      'resolveDilutionStatsBetweenRange',
    );
    const command = new ClientSummaryReportCommand(
      buildStubClientSummaryRequest(),
    );

    await handler.execute(command);

    expect(executeSpy).toHaveBeenCalledTimes(1);
    expect(executeSpy).toHaveBeenCalledWith(
      ['client-1'],
      reserves,
      expect.any(Date),
      expect.any(Date),
    );
  });

  it('should transform data to report rows correctly', async () => {
    const command = new ClientSummaryReportCommand(
      buildStubClientSummaryRequest(),
    );

    await handler.execute(command);

    expect(reportHandler.processReport).toHaveBeenCalledWith(
      ReportType.CSV,
      ReportName.ClientSummary,
      expect.any(Readable),
      expect.objectContaining({
        formatDefinition: expect.objectContaining({
          clientName: expect.objectContaining({ type: 'string' }),
          accountManager: expect.objectContaining({ type: 'string' }),
          factorRate: expect.objectContaining({ type: 'number' }),
          invoiced: expect.objectContaining({ type: 'currency' }),
          dilution: expect.objectContaining({ type: 'percentage' }),
          daysTurn: expect.objectContaining({ type: 'string' }),
        }),
      }),
    );
  });
});
