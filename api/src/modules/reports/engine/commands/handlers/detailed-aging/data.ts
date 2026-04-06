import Big from 'big.js';

export interface DetailedAgingData {
  purchasedDate: Date;
  clientName: string;
  accountManager: string;
  clientMC: string;
  clientDOT: string;
  brokerName: string;
  brokerMC: string;
  brokerDOT: string;
  loadNumber: string;
  accountsReceivableValue: Big;
  approvedFactorFee: Big;
  deduction: Big;
  reserveFee: Big;
  fundedValue: Big | null;
}
