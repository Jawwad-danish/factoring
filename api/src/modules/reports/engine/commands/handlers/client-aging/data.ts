import Big from 'big.js';

export interface ClientAgingReportData {
  clientName: string;
  accountManagerName: string;
  clientMC: string;
  clientDOT: string;
  zeroToThirtyAging: Big;
  thirtyOneToSixtyAging: Big;
  sixtyOneToNinetyAging: Big;
  ninetyPlusAging: Big;
  totalInvoices: Big;
  fees: Big;
}
