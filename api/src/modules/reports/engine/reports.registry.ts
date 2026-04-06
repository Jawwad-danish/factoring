import {
  ApprovedAgingReportCreateRequest,
  BaseReportCreateRequest,
  BatchReportRequest,
  BrokerAgingReportCreateRequest,
  BrokerPaymentReportRequest,
  ClientAccountSummaryReportRequest,
  ClientAnnualReportRequest,
  ClientListReportRequest,
  ClientSummaryRequest,
  ClientTotalReserveReportCreateRequest,
  ClientTrendsReportCreateRequest,
  DetailedAgingReportCreateRequest,
  LoanTapeReportRequest,
  NetFundsEmployedReportRequest,
  PortfolioReportRequest,
  PortoflioReserveReportRequest,
  RollForwardRequest,
  SalesforceReconciliationReportRequest,
  ClientAgingReportRequest,
  ReconciliationReportRequest,
  BrokerRatingReportRequest,
  VolumeReportRequest,
} from '@fs-bobtail/factoring/data';
import { ReportName } from '@module-persistence';
import { ClassConstructor } from 'class-transformer';

interface ReportMetadata {
  requestConstructor: ClassConstructor<BaseReportCreateRequest<any>>;
  template?: string;
}

export class ReportsRegistry {
  private static data = new Map<ReportName, ReportMetadata>();

  static {
    this.data.set(ReportName.ClientTotalReserve, {
      requestConstructor: ClientTotalReserveReportCreateRequest,
    });
    this.data.set(ReportName.ApprovedAging, {
      requestConstructor: ApprovedAgingReportCreateRequest,
      template: 'approved-aging.hbs',
    });
    this.data.set(ReportName.PortfolioReserve, {
      requestConstructor: PortoflioReserveReportRequest,
    });
    this.data.set(ReportName.ClientList, {
      requestConstructor: ClientListReportRequest,
    });
    this.data.set(ReportName.SalesforceReconciliation, {
      requestConstructor: SalesforceReconciliationReportRequest,
    });
    this.data.set(ReportName.Batch, {
      requestConstructor: BatchReportRequest,
    });
    this.data.set(ReportName.ClientAccountSummary, {
      requestConstructor: ClientAccountSummaryReportRequest,
    });
    this.data.set(ReportName.BrokerAging, {
      requestConstructor: BrokerAgingReportCreateRequest,
    });
    this.data.set(ReportName.ClientAnnual, {
      requestConstructor: ClientAnnualReportRequest,
      template: 'client-annual.hbs',
    });
    this.data.set(ReportName.LoanTape, {
      requestConstructor: LoanTapeReportRequest,
    });
    this.data.set(ReportName.DetailedAging, {
      requestConstructor: DetailedAgingReportCreateRequest,
    });
    this.data.set(ReportName.ClientTrends, {
      requestConstructor: ClientTrendsReportCreateRequest,
    });
    this.data.set(ReportName.BrokerPayment, {
      requestConstructor: BrokerPaymentReportRequest,
    });
    this.data.set(ReportName.ClientSummary, {
      requestConstructor: ClientSummaryRequest,
    });
    this.data.set(ReportName.Portfolio, {
      requestConstructor: PortfolioReportRequest,
    });
    this.data.set(ReportName.RollForward, {
      requestConstructor: RollForwardRequest,
    });
    this.data.set(ReportName.NetFundsEmployed, {
      requestConstructor: NetFundsEmployedReportRequest,
    });
    this.data.set(ReportName.ClientAging, {
      requestConstructor: ClientAgingReportRequest,
    });
    this.data.set(ReportName.Reconciliation, {
      requestConstructor: ReconciliationReportRequest,
    });
    this.data.set(ReportName.BrokerRating, {
      requestConstructor: BrokerRatingReportRequest,
    });
    this.data.set(ReportName.Volume, {
      requestConstructor: VolumeReportRequest,
    });
  }

  static get(name: ReportName): ReportMetadata {
    const result = this.data.get(name);
    if (!result) {
      throw new Error(`Report ${name} not found`);
    }
    return result;
  }
}
