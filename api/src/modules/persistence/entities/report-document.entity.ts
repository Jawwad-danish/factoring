import { Entity, Enum, Index, ManyToOne, Property, Rel } from '@mikro-orm/core';
import { BasicMutableEntity } from './basic-mutable.entity';
import { WorkerJobEntity } from './worker-job.entity';

export enum ReportName {
  ClientTotalReserve = 'CLIENT_TOTAL_RESERVE',
  ApprovedAging = 'APPROVED_AGING',
  PortfolioReserve = 'PORTFOLIO_RESERVE',
  ClientList = 'CLIENT_LIST',
  ClientAnnual = 'CLIENT_ANNUAL',
  SalesforceReconciliation = 'SALESFORCE_RECONCILIATION',
  Batch = 'BATCH',
  ClientAccountSummary = 'CLIENT_ACCOUNT_SUMMARY',
  BrokerAging = 'BROKER_AGING',
  LoanTape = 'LOAN_TAPE',
  DetailedAging = 'DETAILED_AGING',
  BrokerPayment = 'BROKER_PAYMENT',
  ClientTrends = 'CLIENT_TRENDS',
  ClientSummary = 'CLIENT_SUMMARY',
  Portfolio = 'PORTFOLIO',
  RollForward = 'ROLL_FORWARD',
  NetFundsEmployed = 'NET_FUNDS_EMPLOYED',
  ClientAging = 'CLIENT_AGING',
  Reconciliation = 'RECONCILIATION',
  BrokerRating = 'BROKER_RATING',
  Volume = 'VOLUME',
}

@Entity({ tableName: 'report_documents' })
export class ReportDocumentEntity extends BasicMutableEntity {
  @Enum({
    items: () => ReportName,
    nullable: false,
    comment: 'The specific type of report generated',
  })
  reportName: ReportName;

  @Property({
    type: 'text',
    nullable: false,
    comment:
      'The storage URL where the generated report file is stored (s3 URL or file path).',
  })
  storageUrl: string;

  @Index()
  @ManyToOne(() => WorkerJobEntity, {
    nullable: false,
  })
  workerJob: Rel<WorkerJobEntity>;
}
