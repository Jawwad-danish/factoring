import { TypedTransform } from '@core/streams';
import { DetailedAgingData } from './data';
import { InvoiceEntitySchema } from '@module-persistence/entities';
import Big from 'big.js';
import { LightweightClient } from '@module-clients/data';
import { LightweightBroker } from '@module-brokers/data';
import { RawDetailedAgingData } from '../../../data-access-types';
import { payableAmount } from '@core/formulas';

export interface DetailedAgingClientData extends LightweightClient {
  clientSuccessTeam?: string;
}

export interface LightweightClientsAndBrokersMapping {
  clients: Map<string, DetailedAgingClientData>;
  brokers: Map<string, LightweightBroker>;
}

export class DetailedAgingDataTransformer extends TypedTransform<
  RawDetailedAgingData,
  DetailedAgingData
> {
  constructor(private readonly mapping: LightweightClientsAndBrokersMapping) {
    super();
  }

  doTransform(chunk: RawDetailedAgingData): DetailedAgingData {
    const broker = this.mapping.brokers.get(chunk.broker_id);
    const client = this.mapping.clients.get(chunk.client_id);

    return {
      purchasedDate: new Date(chunk[InvoiceEntitySchema.COLUMN_PURCHASED_DATE]),
      clientName: client?.name || 'N/A',
      accountManager: client?.clientSuccessTeam || 'N/A',
      clientMC: client?.mc || 'N/A',
      clientDOT: client?.dot || 'N/A',
      brokerName: broker?.doingBusinessAs || 'N/A',
      brokerMC: broker?.mc || 'N/A',
      brokerDOT: broker?.dot || 'N/A',
      loadNumber: chunk[InvoiceEntitySchema.COLUMN_LOAD_NUMBER],
      accountsReceivableValue: new Big(
        chunk[InvoiceEntitySchema.COLUMN_ACCOUNTS_RECEIVABLE_VALUE],
      ),
      approvedFactorFee: new Big(
        chunk[InvoiceEntitySchema.COLUMN_APPROVED_FACTOR_FEE],
      ),
      deduction: new Big(chunk[InvoiceEntitySchema.COLUMN_DEDUCTION]),
      reserveFee: new Big(chunk[InvoiceEntitySchema.COLUMN_RESERVE_FEE]),
      fundedValue: payableAmount({
        accountsReceivableValue: new Big(
          chunk[InvoiceEntitySchema.COLUMN_ACCOUNTS_RECEIVABLE_VALUE],
        ),
        reserveFee: new Big(chunk[InvoiceEntitySchema.COLUMN_RESERVE_FEE]),
        approvedFactorFee: new Big(
          chunk[InvoiceEntitySchema.COLUMN_APPROVED_FACTOR_FEE],
        ),
        deduction: new Big(chunk[InvoiceEntitySchema.COLUMN_DEDUCTION]),
      }),
    };
  }
}
