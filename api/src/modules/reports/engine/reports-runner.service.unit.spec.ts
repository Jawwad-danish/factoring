import { mockMikroORMProvider, mockToken } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import { CommandRunner } from '@module-cqrs';
import {
  ReportDocumentRepository,
  ReportName,
  WorkerJobEntity,
} from '@module-persistence';
import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'stream';
import { ReportType } from '@fs-bobtail/factoring/data';
import {
  ApprovedAgingReportCommand,
  ClientTotalReserveReportCommand,
} from './commands';
import { ReportError } from './errors';
import { REPORT_NOTIFIER, ReportNotifier } from './report-notifiers';
import { REPORT_WRITER, ReportWriter } from './report-writers';
import { ReportsRunnerService } from './reports-runner.service';

describe('ReportsRunnerService', () => {
  let reportsRunnerService: ReportsRunnerService;
  const reportDocumentRepository = createMock<ReportDocumentRepository>();
  const commandRunner = createMock<CommandRunner>();
  const reportWriter = createMock<ReportWriter>();
  const reportNotifier = createMock<ReportNotifier>();

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsRunnerService,
        mockMikroORMProvider,
        {
          provide: ReportDocumentRepository,
          useValue: reportDocumentRepository,
        },
        {
          provide: CommandRunner,
          useValue: commandRunner,
        },
        {
          provide: REPORT_WRITER,
          useValue: reportWriter,
        },
        {
          provide: REPORT_NOTIFIER,
          useValue: reportNotifier,
        },
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    reportsRunnerService = module.get(ReportsRunnerService);
  });

  it('should be defined', () => {
    expect(reportsRunnerService).toBeDefined();
  });

  it('should run client total reserve report successfully', async () => {
    const workerJob = new WorkerJobEntity();
    workerJob.id = 'job-123';

    const reportParameters = {
      name: ReportName.ClientTotalReserve,
      sendTo: 'test@example.com',
      outputType: ReportType.CSV,
    };

    const reportStream = Readable.from(['test data']);
    const writeResult = { storageUrl: 'https://example.com/report' };

    commandRunner.run.mockResolvedValue(reportStream);
    reportWriter.write.mockResolvedValue(writeResult);

    await reportsRunnerService.runReport(workerJob, reportParameters);

    expect(commandRunner.run).toHaveBeenCalledWith(
      expect.any(ClientTotalReserveReportCommand),
    );
    expect(reportWriter.write).toHaveBeenCalledWith(
      reportStream,
      reportParameters,
    );
    expect(reportDocumentRepository.persistAndFlush).toHaveBeenCalled();
    expect(reportNotifier.notify).toHaveBeenCalledWith({
      reportName: 'Client Total Reserve',
      storageUrl: 'https://example.com/report',
      recipientEmail: 'test@example.com',
    });
  });

  it('should run approved aging report successfully', async () => {
    const workerJob = new WorkerJobEntity();
    workerJob.id = 'job-456';

    const reportParameters = {
      name: ReportName.ApprovedAging,
      sendTo: 'test@example.com',
      outputType: ReportType.CSV,
    };

    const reportStream = Readable.from(['test data']);
    const writeResult = { storageUrl: 'https://example.com/report' };
    commandRunner.run.mockResolvedValue(reportStream);
    reportWriter.write.mockResolvedValue(writeResult);

    await reportsRunnerService.runReport(workerJob, reportParameters);

    expect(commandRunner.run).toHaveBeenCalledWith(
      expect.any(ApprovedAgingReportCommand),
    );
    expect(reportWriter.write).toHaveBeenCalledWith(
      reportStream,
      reportParameters,
    );
    expect(reportDocumentRepository.persistAndFlush).toHaveBeenCalled();
    expect(reportNotifier.notify).toHaveBeenCalledWith({
      reportName: 'Approved Aging',
      storageUrl: 'https://example.com/report',
      recipientEmail: 'test@example.com',
    });
  });

  it('should throw ReportError for unknown report type', async () => {
    const workerJob = new WorkerJobEntity();
    const reportParameters = {
      name: 'UnknownReportType' as ReportName,
    };

    await expect(
      reportsRunnerService.runReport(workerJob, reportParameters),
    ).rejects.toThrow(ReportError);
  });
});
