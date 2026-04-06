import { payableAmount } from '@core/formulas';
import { TypedTransform } from '@core/streams';
import { LightweightClient } from '@module-clients/data';
import Big from 'big.js';
import { RawClientNetFundsEmployedData } from '../../../data-access-types';
import { NetFundsEmployedReportData } from './data';
import { TransformCallback } from 'stream';

export interface ClientData extends LightweightClient {
  clientSuccessTeam?: string;
}

export class NetFundsEmployedDataTransformer extends TypedTransform<
  RawClientNetFundsEmployedData,
  NetFundsEmployedReportData
> {
  private rowCount = 0;
  private totalArValue = new Big(0);
  private totalNfe = new Big(0);
  private totalFactorFees = new Big(0);

  constructor(private readonly clients: ClientData[]) {
    super();
  }

  doTransform(
    chunk: RawClientNetFundsEmployedData,
  ): NetFundsEmployedReportData {
    const client = this.clients.find((client) => client.id === chunk.client_id);
    const arTotal = new Big(chunk.ar_total);
    const factorFeesTotal = new Big(chunk.factor_fees_total);

    const payableValue = payableAmount({
      accountsReceivableValue: arTotal,
      reserveFee: new Big(chunk.reserve_fees_total),
      approvedFactorFee: new Big(chunk.factor_fees_total),
      deduction: new Big(chunk.deduction_total),
    });

    this.totalArValue = this.totalArValue.plus(arTotal);
    this.totalNfe = this.totalNfe.plus(payableValue);
    this.totalFactorFees = this.totalFactorFees.plus(factorFeesTotal);
    this.rowCount++;

    return {
      clientName: client?.name || 'N/A',
      accountManagerName: client?.clientSuccessTeam || 'N/A',
      clientMC: client?.mc || 'N/A',
      clientDOT: client?.dot || 'N/A',
      zeroToThirtyAging: new Big(chunk.days_0_to_30),
      thirtyOneToSixtyAging: new Big(chunk.days_31_to_60),
      sixtyOneToNinetyAging: new Big(chunk.days_61_to_90),
      ninetyPlusAging: new Big(chunk.days_91_plus),
      totalInvoices: new Big(chunk.ar_total),
      nfe: payableValue,
      fees: factorFeesTotal,
    };
  }

  _flush(callback: TransformCallback): void {
    if (this.rowCount > 0) {
      const totalRow: NetFundsEmployedReportData = {
        clientName: 'Total',
        accountManagerName: '',
        clientMC: '',
        clientDOT: '',
        zeroToThirtyAging: new Big(0),
        thirtyOneToSixtyAging: new Big(0),
        sixtyOneToNinetyAging: new Big(0),
        ninetyPlusAging: new Big(0),
        totalInvoices: this.totalArValue,
        nfe: this.totalNfe,
        fees: this.totalFactorFees,
      };
      this.push(totalRow);
    }
    callback();
  }
}
