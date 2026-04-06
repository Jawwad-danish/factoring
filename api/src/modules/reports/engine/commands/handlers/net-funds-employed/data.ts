import { Big } from 'big.js';

export interface NetFundsEmployedReportData {
  clientName: string;
  clientMC: string;
  clientDOT: string;
  accountManagerName: string;
  zeroToThirtyAging: Big;
  thirtyOneToSixtyAging: Big;
  sixtyOneToNinetyAging: Big;
  ninetyPlusAging: Big;
  totalInvoices: Big;
  nfe: Big;
  fees: Big;
}
