import { mockMikroORMProvider, mockToken } from '@core/test';
import {
  ReconciliationReportRequest,
  ReportType,
} from '@fs-bobtail/factoring/data';
import { createMock } from '@golevelup/ts-jest';
import { ClientService } from '@module-clients';
import { buildStubClient } from '@module-clients/test';
import {
  BasicEntitySchema,
  ReportName,
  ReserveReason,
  TagDefinitionKey,
} from '@module-persistence/entities';
import {
  Repositories,
  ReserveRepository,
} from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import dayjs from 'dayjs';
import { PassThrough, Readable } from 'stream';
import { ReconciliationReportCommand } from '../../reconciliation-report.command';
import { ReportHandler } from '../report-handler';
import { ReconciliationReportCommandHandler } from './reconciliation-report.command-handler';

const transformMock = new PassThrough();

const readStreamToArray = async <T>(stream: Readable): Promise<T[]> => {
  const rows: T[] = [];
  for await (const chunk of stream as any as AsyncIterable<T>) {
    rows.push(chunk);
  }
  return rows;
};

describe('ReconciliationReportCommandHandler', () => {
  let handler: ReconciliationReportCommandHandler;

  const reportHandler = createMock<ReportHandler>();
  const reserveRepository = createMock<ReserveRepository>();
  const repositories = createMock<Repositories>({
    reserve: reserveRepository,
  });
  const clientService = createMock<ClientService>();

  beforeEach(async () => {
    jest.clearAllMocks();

    reportHandler.processReport.mockResolvedValue(transformMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReconciliationReportCommandHandler,
        mockMikroORMProvider,
        {
          provide: ReportHandler,
          useValue: reportHandler,
        },
        {
          provide: Repositories,
          useValue: repositories,
        },
        {
          provide: ClientService,
          useValue: clientService,
        },
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    handler = module.get<ReconciliationReportCommandHandler>(
      ReconciliationReportCommandHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should execute reconciliation report command', async () => {
    const startDate = new Date('2026-01-01');
    const endDate = new Date('2026-01-31');

    const mockQueryBuilder: any = createMock();
    mockQueryBuilder['leftJoinAndSelect'].mockReturnThis();
    mockQueryBuilder['where'].mockReturnThis();
    mockQueryBuilder['getResultList'].mockResolvedValue([]);
    reserveRepository.readOnlyQueryBuilder.mockReturnValue(mockQueryBuilder);

    clientService.findByIds.mockResolvedValue([]);

    const command = new ReconciliationReportCommand({
      outputType: ReportType.CSV,
      startDate,
      endDate,
    } as any as ReconciliationReportRequest);

    await handler.execute(command);

    expect(reportHandler.processReport).toHaveBeenCalledWith(
      ReportType.CSV,
      ReportName.Reconciliation,
      expect.any(Readable),
      expect.objectContaining({
        formatDefinition: expect.any(Object),
        metadataRow: expect.stringContaining('Reconciliation Report'),
      }),
    );

    expect(reserveRepository.readOnlyQueryBuilder).toHaveBeenCalledWith('r');

    expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
      't.tagDefinition',
      'td',
      expect.objectContaining({
        [`td.${BasicEntitySchema.COLUMN_RECORD_STATUS}`]: expect.anything(),
      }),
    );
  });

  it('should include nonPaymentReason based on latest matching tagDefinition key', async () => {
    const createdAt = new Date('2026-01-15T05:06:07.000Z');
    const startDate = new Date('2026-01-01');
    const endDate = new Date('2026-01-31');

    const reserveId = 'reserve-1';
    const clientId = 'client-1';

    const tags = {
      getItems: () => [
        {
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          tagDefinition: {
            key: TagDefinitionKey.DUPLICATE_INVOICE,
            name: 'Duplicate Invoice',
          },
        },
      ],
    };

    const reserves = [
      {
        id: reserveId,
        clientId,
        amount: new Big(123),
        createdAt,
        reason: ReserveReason.NonPayment,
        reserveInvoice: {
          invoice: {
            tags,
          },
        },
      },
    ];

    const mockQueryBuilder: any = createMock();
    mockQueryBuilder['leftJoinAndSelect'].mockReturnThis();
    mockQueryBuilder['where'].mockReturnThis();
    mockQueryBuilder['getResultList'].mockResolvedValue(reserves);
    reserveRepository.readOnlyQueryBuilder.mockReturnValue(mockQueryBuilder);

    clientService.findByIds.mockResolvedValue([
      buildStubClient({
        id: clientId,
        name: 'Acme LLC',
      }),
    ]);

    const stream = await handler.getReportDataStream({
      outputType: ReportType.CSV,
      startDate,
      endDate,
    } as any as ReconciliationReportRequest);

    const rows = await readStreamToArray<any>(stream);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual(
      expect.objectContaining({
        clientId,
        clientName: 'Acme LLC',
        reason: ReserveReason.NonPayment,
        nonPaymentReason: 'Duplicate Invoice',
        date: dayjs(createdAt).format('MM/DD/YYYY hh:mm:ss A'),
      }),
    );

    expect(rows[0].amount).toBeInstanceOf(Big);
    expect(rows[0].amount.toString()).toBe('123');
  });
});
