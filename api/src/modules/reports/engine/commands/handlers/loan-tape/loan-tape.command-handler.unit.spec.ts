import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'stream';
import { BrokerService } from '@module-brokers';
import { ClientService } from '@module-clients';
import {
  InvoiceRepository,
  Repositories,
} from '@module-persistence/repositories';
import {
  InvoiceEntity,
  ReportName,
  TagDefinitionKey,
} from '@module-persistence/entities';
import { ReportType } from '@fs-bobtail/factoring/data';
import { LoanTapeReportCommand } from '../../loan-tape-report.command';
import { ReportHandler } from '../report-handler';
import { LoanTapeReportCommandHandler } from './loan-tape.command-handler';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { PassThrough } from 'stream';
import { buildStubLoanTapeCreateRequest } from '@module-reports';
import { buildStubClient } from '@module-clients/test';
import { buildStubBroker } from '@module-brokers/test';
import { QueryBuilder } from '@mikro-orm/postgresql';

const transformMock = new PassThrough();

describe('LoanTapeReportCommandHandler', () => {
  let handler: LoanTapeReportCommandHandler;
  const clientService = createMock<ClientService>();
  const brokerService = createMock<BrokerService>();
  const reportHandler = createMock<ReportHandler>();
  const invoiceRepository = createMock<InvoiceRepository>();

  const repositories = createMock<Repositories>({
    invoice: invoiceRepository,
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    reportHandler.processReport.mockResolvedValue(transformMock);
    clientService.findByIds.mockResolvedValue([buildStubClient()]);
    brokerService.findByIds.mockResolvedValue([buildStubBroker()]);

    const mockQueryBuilder = createMock();
    mockQueryBuilder['select'].mockReturnThis();
    mockQueryBuilder['leftJoinAndSelect'].mockReturnThis();
    mockQueryBuilder['where'].mockReturnThis();
    mockQueryBuilder['orderBy'].mockReturnThis();
    mockQueryBuilder['addSelect'].mockReturnThis();
    mockQueryBuilder['execute'].mockResolvedValue([
      {
        id: 'invoice-1',
        loadNumber: 'LOAD123',
        accountsReceivableValue: 1000,
        purchasedDate: new Date(),
        clientId: 'client-1',
        brokerId: 'broker-1',
        status: 'purchased',
        verificationStatus: 'verified',
        createdAt: new Date(),
        updatedAt: new Date(),
        deduction: 0,
        paymentDate: new Date(),
        approvedFactorFee: 50,
        invoiceClientPayments: [],
        brokerPayments: {
          getItems: () => [],
        },
        activities: [
          {
            id: 'activity-activity-1',
            createdAt: new Date(),
            updatedAt: new Date(),
            tagDefinition: {
              id: 'tag-definition-1',
              name: 'Broker not Found',
              key: TagDefinitionKey.BROKER_NOT_FOUND,
              usedBy: ['user', 'system'],
              visibility: 'client',
            },
          },
        ],
      },
    ]);

    invoiceRepository.readOnlyQueryBuilder.mockReturnValue(
      mockQueryBuilder as QueryBuilder<InvoiceEntity>,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoanTapeReportCommandHandler,
        Repositories,
        mockMikroORMProvider,
        {
          provide: ClientService,
          useValue: clientService,
        },
        {
          provide: BrokerService,
          useValue: brokerService,
        },
        {
          provide: ReportHandler,
          useValue: reportHandler,
        },
        {
          provide: Repositories,
          useValue: repositories,
        },
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    handler = module.get<LoanTapeReportCommandHandler>(
      LoanTapeReportCommandHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should execute loan tape report with purchased invoices', async () => {
    const processReportSpy = reportHandler.processReport.mockResolvedValueOnce(
      Readable.from([]),
    );
    const queryBuilderSpy = jest.spyOn(
      repositories.invoice,
      'readOnlyQueryBuilder',
    );
    const command = new LoanTapeReportCommand(buildStubLoanTapeCreateRequest());

    await handler.execute(command);

    expect(processReportSpy).toHaveBeenCalledTimes(1);
    expect(processReportSpy).toHaveBeenCalledWith(
      ReportType.CSV,
      ReportName.LoanTape,
      expect.any(Readable),
      expect.objectContaining({
        formatDefinition: expect.any(Object),
      }),
    );
    expect(queryBuilderSpy).toHaveBeenCalledWith('i');
    expect(queryBuilderSpy).toHaveBeenCalledTimes(1);

    const queryBuilder = queryBuilderSpy.mock.results[0].value;
    expect(queryBuilder.select).toHaveBeenCalledWith(
      expect.arrayContaining([
        'i.id',
        'i.load_number',
        'i.accounts_receivable_value',
        'i.purchased_date',
        'i.client_id',
        'i.broker_id',
      ]),
    );
  });

  it('should include declined invoices when requested', async () => {
    const processReportSpy = reportHandler.processReport.mockResolvedValueOnce(
      Readable.from([]),
    );
    const queryBuilderSpy = jest.spyOn(
      repositories.invoice,
      'readOnlyQueryBuilder',
    );
    const command = new LoanTapeReportCommand(
      buildStubLoanTapeCreateRequest({
        includeDeclinedInvoices: true,
      }),
    );

    await handler.execute(command);

    expect(processReportSpy).toHaveBeenCalledTimes(1);
    expect(processReportSpy).toHaveBeenCalledWith(
      ReportType.CSV,
      ReportName.LoanTape,
      expect.any(Readable),
      expect.objectContaining({
        formatDefinition: expect.any(Object),
      }),
    );
    expect(queryBuilderSpy).toHaveBeenCalledWith('i');
    expect(queryBuilderSpy).toHaveBeenCalledTimes(2);
  });

  it('should include pending and declined invoices when requested', async () => {
    const processReportSpy = reportHandler.processReport.mockResolvedValueOnce(
      Readable.from([]),
    );
    const queryBuilderSpy = jest.spyOn(
      repositories.invoice,
      'readOnlyQueryBuilder',
    );
    const command = new LoanTapeReportCommand(
      buildStubLoanTapeCreateRequest({
        includePendingInvoices: true,
        includeDeclinedInvoices: true,
      }),
    );

    await handler.execute(command);

    expect(processReportSpy).toHaveBeenCalledTimes(1);
    expect(processReportSpy).toHaveBeenCalledWith(
      ReportType.CSV,
      ReportName.LoanTape,
      expect.any(Readable),
      expect.objectContaining({
        formatDefinition: expect.any(Object),
      }),
    );
    expect(queryBuilderSpy).toHaveBeenCalledWith('i');
    expect(queryBuilderSpy).toHaveBeenCalledTimes(3);
  });

  it('should build correct format definition', async () => {
    const command = new LoanTapeReportCommand(
      buildStubLoanTapeCreateRequest({
        includeInvoiceUpdates: true,
        includeLastUpdateDate: true,
      }),
    );

    await handler.execute(command);

    expect(reportHandler.processReport).toHaveBeenCalledWith(
      ReportType.CSV,
      ReportName.LoanTape,
      expect.any(Readable),
      expect.objectContaining({
        formatDefinition: expect.objectContaining({
          submittedDate: expect.objectContaining({ type: 'date-time' }),
          invoiceStatus: expect.objectContaining({ type: 'string' }),
          clientName: expect.objectContaining({ type: 'string' }),
          brokerName: expect.objectContaining({ type: 'string' }),
          loadNumber: expect.objectContaining({ type: 'string' }),
          accountsReceivableAmount: expect.objectContaining({
            type: 'currency',
          }),
          activityLogs: expect.objectContaining({ type: 'string' }),
          lastUpdateDate: expect.objectContaining({ type: 'date-time' }),
        }),
      }),
    );
  });

  it('should transform invoice data to report rows correctly', async () => {
    const command = new LoanTapeReportCommand(
      buildStubLoanTapeCreateRequest({
        includeInvoiceUpdates: true,
      }),
    );

    await handler.execute(command);

    const dataStreamCall = reportHandler.processReport.mock.calls[0][2];
    expect(dataStreamCall).toBeDefined();
  });
});
