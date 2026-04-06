import Big from 'big.js';

export interface VolumeReportData {
  clientName: string;
  accountManagerName: string;
  clientMC: string;
  clientDOT: string;
  salesperson: string;
  totalInvoices: Big;
  totalFees: Big;
}
