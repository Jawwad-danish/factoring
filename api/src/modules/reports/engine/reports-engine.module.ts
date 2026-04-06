import { AWSModule } from '@module-aws';
import { BobtailConfigModule } from '@module-config';
import { DatabaseModule } from '@module-database';
import { EmailModule } from '@module-email';
import { PersistenceModule } from '@module-persistence';
import { Module } from '@nestjs/common';

import { BrokersModule } from '@module-brokers';
import { ClientsModule } from '@module-clients';
import { EventEmitterModule } from '@nestjs/event-emitter';
import {
  EmailReportNotifier,
  reportNotifierProvider,
} from './report-notifiers';
import { reportWriterProvider } from './report-writers';
import { ReportsRunnerService } from './reports-runner.service';
import { ReportsDataAccess } from './reports.data-access';
import { ClientTrendsReportsDataAccess } from './client-trends.data-access';

import { CqrsModule } from '@module-cqrs';
import { InvoicesModule } from '@module-invoices';
import { ClientAccountSummaryDataAccess } from './client-account-summary.data-access';
import {
  ApprovedAgingReportCommandHandler,
  BatchReportCommandHandler,
  BrokerAgingReportCommandHandler,
  BrokerPaymentReportCommandHandler,
  BrokerRatingReportCommandHandler,
  ClientAccountSummaryReportCommandHandler,
  ClientAgingReportCommandHandler,
  ClientAnnualCommandHandler,
  ClientListReportCommandHandler,
  ClientSummaryReportCommandHandler,
  ClientTotalReserveReportCommandHandler,
  ClientTrendsReportCommandHandler,
  DetailedAgingReportCommandHandler,
  LoanTapeReportCommandHandler,
  NetFundsEmployedReportCommandHandler,
  PortfolioReportCommandHandler,
  PortoflioReserveReportCommandHandler,
  ReconciliationReportCommandHandler,
  ReportHandler,
  RollForwardReportCommandHandler,
  SalesforceReconciliationReportCommandHandler,
  VolumeReportCommandHandler,
} from './commands/handlers';
import {
  CsvSerializer,
  ExcelSerializer,
  PdfSerializer,
  ReportSerializerProvider,
} from './serialization';
import { templateLoaderProvider } from './templates';

const commandHandlers = [
  ApprovedAgingReportCommandHandler,
  BatchReportCommandHandler,
  BrokerAgingReportCommandHandler,
  BrokerPaymentReportCommandHandler,
  ClientAccountSummaryReportCommandHandler,
  ClientAnnualCommandHandler,
  ClientListReportCommandHandler,
  ClientSummaryReportCommandHandler,
  PortfolioReportCommandHandler,
  ClientTotalReserveReportCommandHandler,
  ClientTrendsReportCommandHandler,
  DetailedAgingReportCommandHandler,
  LoanTapeReportCommandHandler,
  PortoflioReserveReportCommandHandler,
  ReconciliationReportCommandHandler,
  RollForwardReportCommandHandler,
  SalesforceReconciliationReportCommandHandler,
  NetFundsEmployedReportCommandHandler,
  ClientAgingReportCommandHandler,
  BrokerRatingReportCommandHandler,
  VolumeReportCommandHandler,
];

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    DatabaseModule,
    AWSModule,
    EmailModule,
    PersistenceModule,
    BobtailConfigModule,
    ClientsModule,
    BrokersModule,
    CqrsModule,
    InvoicesModule,
  ],
  providers: [
    ReportsRunnerService,
    ReportsDataAccess,
    ClientAccountSummaryDataAccess,
    ClientTrendsReportsDataAccess,
    reportWriterProvider,
    EmailReportNotifier,
    reportNotifierProvider,
    CsvSerializer,
    ExcelSerializer,
    PdfSerializer,
    templateLoaderProvider,
    ReportSerializerProvider,
    ReportHandler,
    ...commandHandlers,
  ],
  exports: [
    ReportsRunnerService,
    ReportsDataAccess,
    reportWriterProvider,
    EmailReportNotifier,
    reportNotifierProvider,
  ],
})
export class ReportsEngineModule {}
