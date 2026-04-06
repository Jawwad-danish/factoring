import { TypedTransform } from '@core/streams';
import {
  RawClientFactoringConfigWithTeam,
  RawVolumeReportInvoiceData,
} from '../../../data-access-types';
import { VolumeReportData } from './data';
import { LightweightClient } from '@module-clients/data';
import Big from 'big.js';

export class VolumeReportDataTransformer extends TypedTransform<
  RawClientFactoringConfigWithTeam,
  VolumeReportData
> {
  constructor(
    private readonly clientsMap: Map<string, LightweightClient>,
    private readonly invoiceDataMap: Map<string, RawVolumeReportInvoiceData>,
  ) {
    super();
  }

  doTransform(chunk: RawClientFactoringConfigWithTeam): VolumeReportData {
    const clientData = this.clientsMap.get(chunk.client_id);
    const invoiceData = this.invoiceDataMap.get(chunk.client_id);

    const arTotal = invoiceData ? new Big(invoiceData.ar_total) : new Big(0);
    const factorFeesTotal = invoiceData
      ? new Big(invoiceData.factor_fees_total)
      : new Big(0);

    const salesRepName =
      [chunk.sales_rep_first_name, chunk.sales_rep_last_name]
        .filter(Boolean)
        .join(' ') || 'N/A';

    return {
      clientName: clientData?.name || 'N/A',
      accountManagerName: chunk.client_success_team_name || 'N/A',
      clientMC: clientData?.mc || 'N/A',
      clientDOT: clientData?.dot || 'N/A',
      salesperson: salesRepName,
      totalInvoices: arTotal,
      totalFees: factorFeesTotal,
    };
  }
}
