import { TypedTransform } from '@core/streams';
import { LightweightClient } from '@module-clients/data';
import Big from 'big.js';
import { RawClientNetFundsEmployedData } from '../../../data-access-types';
import { TransformCallback } from 'stream';
import { ClientAgingReportData } from './data';

export interface ClientData extends LightweightClient {
  clientSuccessTeam: string;
}

export class ClientAgingDataTransformer extends TypedTransform<
  RawClientNetFundsEmployedData,
  ClientAgingReportData
> {
  private rowCount = 0;
  private totalArValue = new Big(0);
  private totalFactorFees = new Big(0);
  private totalZeroToThirty = new Big(0);
  private totalThirtyOneToSixty = new Big(0);
  private totalSixtyOneToNinety = new Big(0);
  private totalNinetyPlus = new Big(0);

  constructor(private readonly clients: ClientData[]) {
    super();
  }

  doTransform(chunk: RawClientNetFundsEmployedData): ClientAgingReportData {
    const client = this.clients.find((client) => client.id === chunk.client_id);
    const arTotal = new Big(chunk.ar_total);
    const factorFeesTotal = new Big(chunk.factor_fees_total);
    const zeroToThirty = new Big(chunk.days_0_to_30);
    const thirtyOneToSixty = new Big(chunk.days_31_to_60);
    const sixtyOneToNinety = new Big(chunk.days_61_to_90);
    const ninetyPlus = new Big(chunk.days_91_plus);

    this.totalArValue = this.totalArValue.plus(arTotal);
    this.totalFactorFees = this.totalFactorFees.plus(factorFeesTotal);
    this.totalZeroToThirty = this.totalZeroToThirty.plus(zeroToThirty);
    this.totalThirtyOneToSixty =
      this.totalThirtyOneToSixty.plus(thirtyOneToSixty);
    this.totalSixtyOneToNinety =
      this.totalSixtyOneToNinety.plus(sixtyOneToNinety);
    this.totalNinetyPlus = this.totalNinetyPlus.plus(ninetyPlus);
    this.rowCount++;

    return {
      clientName: client?.name || 'N/A',
      accountManagerName: client?.clientSuccessTeam || 'N/A',
      clientMC: client?.mc || 'N/A',
      clientDOT: client?.dot || 'N/A',
      zeroToThirtyAging: zeroToThirty,
      thirtyOneToSixtyAging: thirtyOneToSixty,
      sixtyOneToNinetyAging: sixtyOneToNinety,
      ninetyPlusAging: ninetyPlus,
      totalInvoices: new Big(chunk.ar_total),
      fees: factorFeesTotal,
    };
  }

  _flush(callback: TransformCallback): void {
    if (this.rowCount > 0) {
      const totalRow: ClientAgingReportData = {
        clientName: 'Total',
        accountManagerName: '',
        clientMC: '',
        clientDOT: '',
        zeroToThirtyAging: this.totalZeroToThirty,
        thirtyOneToSixtyAging: this.totalThirtyOneToSixty,
        sixtyOneToNinetyAging: this.totalSixtyOneToNinety,
        ninetyPlusAging: this.totalNinetyPlus,
        totalInvoices: this.totalArValue,
        fees: this.totalFactorFees,
      };
      this.push(totalRow);
    }
    callback();
  }
}
