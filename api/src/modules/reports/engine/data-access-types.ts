import Big from 'big.js';
import type { ReserveReason } from '@module-persistence/entities';
import type { TimeRangeMetrics } from '@common/data';

export interface RawApprovedAgingData {
  client_id: string;
  broker_id: string;
  load_number: string;
  accounts_receivable_value: number;
  line_haul_rate: number;
  created_at: Date;
  display_id: string;
}

export interface RawDetailedAgingData {
  accounts_receivable_value: Big;
  approved_factor_fee: Big;
  broker_id: string;
  client_id: string;
  deduction: Big;
  reserve_fee: Big;
  load_number: string;
  purchased_date: Date;
  funded_amount: null | Big;
}

export interface RawClientTotalReserve {
  client_id: string;
  total: number;
}

export interface RawClientAccountSummaryData {
  clientId: string;
  days0to30: number;
  days31to60: number;
  days61to90: number;
  days91plus: number;
  factorFeesTotal: number;
  reservesTotal: number;
}

export interface RawClientNetFundsEmployedData {
  client_id: string;
  days_0_to_30: number;
  days_31_to_60: number;
  days_61_to_90: number;
  days_91_plus: number;
  ar_total: number;
  factor_fees_total: number;
  reserve_fees_total: number;
  deduction_total: number;
}

export interface RawClientFactoringConfigWithTeam {
  client_id: string;
  client_success_team_name: string | null;
  sales_rep_first_name: string | null;
  sales_rep_last_name: string | null;
}
export interface RawVolumeReportInvoiceData {
  client_id: string;
  ar_total: string;
  factor_fees_total: string;
}

export interface RawPortfolioClientsInvoiceAggRow {
  client_id: string;
  start_date: Date;
  total_factor: string | number | null;
  total_fee: string | number | null;
}

export interface ClientsAndBrokerIds {
  clientIds: string[];
  brokerIds: string[];
}

export interface ClientDilutionStats {
  dilution: Big;
  adjDilution: Big;
  daysToPay: Big;
}

export interface RawClientTrendsData {
  monthlyInvoiced: Big;
  monthlyAverageInvoice: Big;
  monthlyFactorFees: Big;
  reserves: Big;
  invoicesAR: Big;
  totalAR: Big;
  totalFactorFees: Big;
  totalDeductions: Big;
  totalNfe: Big;
  monthlyYield: string;
  dilution: string;
  adjDilution: string;
  daysToPay: string;
  daysToPost: string;
}

export interface InvoicedAverages {
  invoiced: Big;
  averageInvoice: Big;
  factorFees: Big;
  yieldVal: Big;
}

export interface PendingTotalsRow {
  clientId: string;
  total: Big;
  feesTotal: Big;
  deductionsTotal: Big;
  reserveFeesTotal: Big;
}

export interface InvoiceARFeesDeductionsNfe {
  invoicesAR: Big;
  totalFactorFees: Big;
  totalDeductions: Big;
  totalNfe: Big;
}

export interface BalanceTotals {
  debtorClaim: number;
  clientCredit: number;
  otherFees: number;
  writeOff: number;
  chargeback: number;
  directPayment: number;
  nonFacoredPayment: number;
  additionalPayment: number;
  shortPay: number;
  nonPayment: number;
  overPay: number;
}

export interface DilutionStats {
  dilution: Big;
  adjDilution: Big;
  daysToPay: Big;
  daysToPost: Big;
}

export interface InvoiceStats {
  totalAR: Big;
  daysToPayTotal: Big;
  daysToPostTotal: Big;
  count: number;
}

export interface InvoiceStatsByClient {
  byClient: Map<string, InvoiceStats>;
  aggregate: InvoiceStats;
}

export interface ReserveByReasonItem {
  reason: ReserveReason;
  total: number;
}

export interface ReserveSumsByClient {
  byClient: Map<string, ReserveByReasonItem[]>;
  aggregate: ReserveByReasonItem[];
}

export interface DilutionRates {
  dilution: number;
  adjDilution: number;
}

export interface DilutionResult {
  dilution: Big;
  adjDilution: Big;
}

export interface DaysToPayMetrics {
  brokerId: string;
  metrics: TimeRangeMetrics;
}
