import { FilterOperator, PageCriteria } from '@core/data';
import { mockToken } from '@core/test';
import { WrappedReadable } from '@core/util';
import {
  ApprovedAgingReportCreateRequest,
  ReportType,
} from '@fs-bobtail/factoring/data';
import { createMock } from '@golevelup/ts-jest';
import { BrokerService } from '@module-brokers';
import { ClientService } from '@module-clients';
import { Test, TestingModule } from '@nestjs/testing';
import { PassThrough, Readable } from 'stream';
import { ReportName } from '../../../../../persistence';
import { ReportsDataAccess } from '../../../reports.data-access';
import { ApprovedAgingReportCommand } from '../../approved-aging-report.command';
import { ReportHandler } from '../report-handler';
import { ApprovedAgingReportCommandHandler } from './approved-aging-report.command-handler';

const wrappedReadable = new WrappedReadable(Readable.from([]));
const transformMock = new PassThrough();

jest.mock('./approved-aging.data-transformer', () => ({
  ApprovedAgingDataTransformer: jest
    .fn()
    .mockImplementation(() => transformMock),
}));

describe('ApprovedAgingReportCommandHandler', () => {
  let handler: ApprovedAgingReportCommandHandler;
  const reportsDataAccess = createMock<ReportsDataAccess>();
  const clientService = createMock<ClientService>();
  const brokerService = createMock<BrokerService>();
  const reportHandler = createMock<ReportHandler>();

  beforeEach(async () => {
    jest.clearAllMocks();

    reportHandler.processReport.mockResolvedValue(transformMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovedAgingReportCommandHandler,
        {
          provide: ReportsDataAccess,
          useValue: reportsDataAccess,
        },
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
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    handler = module.get<ApprovedAgingReportCommandHandler>(
      ApprovedAgingReportCommandHandler,
    );

    const mockRawData = [
      {
        created_at: new Date(),
        load_number: 'LOAD-123',
        display_id: 'INV-123',
        client_id: 'client-1',
        broker_id: 'broker-1',
        accounts_receivable_value: 1000,
      },
    ];

    const mockReadable = Readable.from(mockRawData);
    mockReadable.pipe = jest.fn().mockReturnValue(mockReadable);
    reportsDataAccess.getApprovedAging.mockResolvedValue(wrappedReadable);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should fetch data from the reports data access layer', async () => {
    const request = new ApprovedAgingReportCreateRequest({
      outputType: ReportType.CSV,
      sendTo: 'test@example.com',
    });
    const command = new ApprovedAgingReportCommand(request);

    await handler.execute(command);

    expect(reportsDataAccess.getApprovedAging).toHaveBeenCalledWith(undefined);
  });

  it('should pass query criteria to data access layer', async () => {
    const criteria = {
      filters: [
        { name: 'status', operator: FilterOperator.EQ, value: 'active' },
      ],
      page: new PageCriteria(),
      sort: [],
    };
    const request = new ApprovedAgingReportCreateRequest({
      outputType: ReportType.CSV,
      sendTo: 'test@example.com',
      criteria,
    });
    const command = new ApprovedAgingReportCommand(request);

    await handler.execute(command);

    expect(reportsDataAccess.getApprovedAging).toHaveBeenCalledWith(criteria);
  });

  it('should provide the correct format definition to report handler', async () => {
    const request = new ApprovedAgingReportCreateRequest({
      outputType: ReportType.CSV,
      sendTo: 'test@example.com',
    });
    const command = new ApprovedAgingReportCommand(request);

    const formatDefinitionSpy = jest.spyOn(handler, 'getSerializerOptions');

    await handler.execute(command);

    expect(formatDefinitionSpy).toHaveBeenCalled();
    expect(reportHandler.processReport).toHaveBeenCalledWith(
      ReportType.CSV,
      ReportName.ApprovedAging,
      expect.any(Readable),
      expect.objectContaining({
        formatDefinition: expect.objectContaining({
          createdAt: expect.objectContaining({ type: 'date' }),
          clientName: expect.objectContaining({ type: 'string' }),
          brokerName: expect.objectContaining({ type: 'string' }),
          displayId: expect.objectContaining({ type: 'string' }),
          loadNumber: expect.objectContaining({ type: 'string' }),
          arValue: expect.objectContaining({ type: 'currency' }),
          lineHaulRate: expect.objectContaining({ type: 'currency' }),
        }),
      }),
    );
  });
});
