import {
  BaseReportCreateRequest,
  BatchReportRequest,
  BrokerAgingReportCreateRequest,
  BrokerPaymentReportRequest,
  ClientAccountSummaryReportRequest,
  ClientAnnualReportRequest,
  ClientListReportRequest,
  ClientSummaryRequest,
  ClientTrendsReportCreateRequest,
  DetailedAgingReportCreateRequest,
  LoanTapeReportRequest,
  NetFundsEmployedReportRequest,
  PortfolioReportRequest,
  PortoflioReserveReportRequest,
  RollForwardRequest,
  SalesforceReconciliationReportRequest,
  ReconciliationReportRequest,
  ClientAgingReportRequest,
  BrokerRatingReportRequest,
  VolumeReportRequest,
} from '@fs-bobtail/factoring/data';
import { CommandRunner } from '@module-cqrs';
import {
  ReportDocumentEntity,
  ReportDocumentRepository,
  ReportName,
  WorkerJobEntity,
} from '@module-persistence';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CrossCuttingConcerns } from '../../../core';
import {
  ApprovedAgingReportCommand,
  BatchReportCommand,
  BrokerAgingReportCommand,
  BrokerPaymentReportCommand,
  ClientAccountSummaryReportCommand,
  ClientAnnualReportCommand,
  ClientListReportCommand,
  ClientSummaryReportCommand,
  ClientTotalReserveReportCommand,
  ClientTrendsReportCommand,
  DetailedAgingReportCommand,
  LoanTapeReportCommand,
  NetFundsEmployedReportCommand,
  PortfolioReportCommand,
  PortoflioReserveReportCommand,
  ReportCommand,
  RollForwardReportCommand,
  ReconciliationReportCommand,
  SalesforceReconciliationReportCommand,
  ClientAgingReportCommand,
  BrokerRatingReportCommand,
  VolumeReportCommand,
} from './commands';
import { ReportError } from './errors';
import { REPORT_NOTIFIER, ReportNotifier } from './report-notifiers';
import { REPORT_WRITER, ReportWriter } from './report-writers';
import { ReportsRegistry } from './reports.registry';

@Injectable()
export class ReportsRunnerService {
  private readonly logger = new Logger(ReportsRunnerService.name);

  constructor(
    private readonly reportDocumentRepository: ReportDocumentRepository,
    private readonly commandRunner: CommandRunner,
    @Inject(REPORT_WRITER) private readonly reportWriter: ReportWriter,
    @Inject(REPORT_NOTIFIER) private readonly reportNotifier: ReportNotifier,
  ) {}

  @CrossCuttingConcerns({
    error: {
      errorSupplier: (
        cause: Error,
        _workerJob: WorkerJobEntity,
        parameters: any,
      ) => new ReportError(parameters.name, cause),
    },
    logging: (workerJob: WorkerJobEntity, parameters: any) => {
      return {
        message: `Running report ${parameters.name} for job ${workerJob.id}`,
        payload: {
          reportName: parameters.name,
          parameters: parameters,
        },
      };
    },
  })
  async runReport(workerJob: WorkerJobEntity, parameters: any): Promise<void> {
    const RequestClass = ReportsRegistry.get(
      parameters.name,
    ).requestConstructor;
    if (!RequestClass) {
      throw ReportError.fromMessage(
        parameters.name,
        `Could not find type for report to serialize payload`,
      );
    }
    const requestInstance = plainToInstance(RequestClass, parameters);
    const reportCommand = this.getReportCommand(requestInstance);

    const reportStream = await this.commandRunner.run(reportCommand);
    const writeResult = await this.reportWriter.write(
      reportStream,
      reportCommand.request,
    );

    const reportDocument = new ReportDocumentEntity();
    reportDocument.reportName = reportCommand.request.name;
    reportDocument.storageUrl = writeResult.storageUrl;
    reportDocument.workerJob = workerJob;

    await this.reportDocumentRepository.persistAndFlush(reportDocument);

    this.logger.log(
      `Successfully wrote report ${reportCommand.request.name} for job ${workerJob.id} to ${writeResult.storageUrl} and saved document ${reportDocument.id}`,
    );

    await this.reportNotifier.notify({
      reportName: reportCommand.humanReadableName,
      storageUrl: writeResult.storageUrl,
      recipientEmail: reportCommand.request.sendTo,
    });
  }

  private getReportCommand<T extends BaseReportCreateRequest<T>>(
    request: T,
  ): ReportCommand<any> {
    switch (request.name) {
      case ReportName.ClientTotalReserve:
        return new ClientTotalReserveReportCommand(request);
      case ReportName.ApprovedAging:
        return new ApprovedAgingReportCommand(request);
      case ReportName.PortfolioReserve:
        if (request instanceof PortoflioReserveReportRequest) {
          return new PortoflioReserveReportCommand(request);
        }
      case ReportName.ClientList:
        if (request instanceof ClientListReportRequest) {
          return new ClientListReportCommand(request);
        }
      case ReportName.SalesforceReconciliation:
        if (request instanceof SalesforceReconciliationReportRequest) {
          return new SalesforceReconciliationReportCommand(request);
        }
      case ReportName.Batch:
        if (request instanceof BatchReportRequest) {
          return new BatchReportCommand(request);
        }
      case ReportName.ClientAccountSummary:
        if (request instanceof ClientAccountSummaryReportRequest) {
          return new ClientAccountSummaryReportCommand(request);
        }
      case ReportName.BrokerAging:
        if (request instanceof BrokerAgingReportCreateRequest) {
          return new BrokerAgingReportCommand(request);
        }
      case ReportName.ClientAnnual:
        if (request instanceof ClientAnnualReportRequest) {
          return new ClientAnnualReportCommand(request);
        }
      case ReportName.LoanTape:
        if (request instanceof LoanTapeReportRequest) {
          return new LoanTapeReportCommand(request);
        }
      case ReportName.DetailedAging:
        if (request instanceof DetailedAgingReportCreateRequest) {
          return new DetailedAgingReportCommand(request);
        }
      case ReportName.ClientTrends:
        if (request instanceof ClientTrendsReportCreateRequest) {
          return new ClientTrendsReportCommand(request);
        }
      case ReportName.BrokerPayment:
        if (request instanceof BrokerPaymentReportRequest) {
          return new BrokerPaymentReportCommand(request);
        }
      case ReportName.ClientSummary:
        if (request instanceof ClientSummaryRequest) {
          return new ClientSummaryReportCommand(request);
        }
      case ReportName.Portfolio:
        if (request instanceof PortfolioReportRequest) {
          return new PortfolioReportCommand(request);
        }
      case ReportName.RollForward:
        if (request instanceof RollForwardRequest) {
          return new RollForwardReportCommand(request);
        }
      case ReportName.Reconciliation:
        if (request instanceof ReconciliationReportRequest) {
          return new ReconciliationReportCommand(request);
        }
      case ReportName.NetFundsEmployed:
        if (request instanceof NetFundsEmployedReportRequest) {
          return new NetFundsEmployedReportCommand(request);
        }
      case ReportName.ClientAging:
        if (request instanceof ClientAgingReportRequest) {
          return new ClientAgingReportCommand(request);
        }
      case ReportName.BrokerRating:
        if (request instanceof BrokerRatingReportRequest) {
          return new BrokerRatingReportCommand(request);
        }
      case ReportName.Volume:
        if (request instanceof VolumeReportRequest) {
          return new VolumeReportCommand(request);
        }
      default:
        throw new NotFoundException(
          `Command class for report '${request.name}' not found.`,
        );
    }
  }
}
