import { TypedTransform } from '@core/streams';
import { Logger } from '@nestjs/common';
import { TransformCallback } from 'stream';
import { ApprovedAgingData, ClientsAndBrokersMapping } from './data';
import { RawApprovedAgingData } from '../../../data-access-types';

export class ApprovedAgingDataTransformer extends TypedTransform<
  RawApprovedAgingData,
  ApprovedAgingData
> {
  private readonly logger = new Logger(ApprovedAgingDataTransformer.name);
  private totalArValue = 0;
  private totalLineHaulRate = 0;
  private rowCount = 0;

  constructor(private readonly mapping: ClientsAndBrokersMapping) {
    super();
  }

  doTransform(chunk: RawApprovedAgingData): ApprovedAgingData {
    const broker = this.mapping.brokers.get(chunk.broker_id);
    const client = this.mapping.clients.get(chunk.client_id);
    let brokerName = 'N/A';
    let clientName = 'N/A';

    if (broker) {
      brokerName = `${broker.legalName}/MC: ${broker.mc}`;
    } else {
      this.logger.warn('Broker not found', {
        brokerId: chunk.broker_id,
      });
    }
    if (client) {
      clientName = `${client.name}/MC: ${client.mc}`;
    } else {
      this.logger.warn('Client not found', {
        clientId: chunk.client_id,
      });
    }

    this.totalArValue += Number(chunk.accounts_receivable_value) || 0;
    this.totalLineHaulRate += Number(chunk.line_haul_rate) || 0;
    this.rowCount++;

    const standardizedData: ApprovedAgingData = {
      createdAt: chunk.created_at,
      loadNumber: chunk.load_number,
      displayId: chunk.display_id,
      brokerName,
      clientName,
      arValue: chunk.accounts_receivable_value,
      lineHaulRate: chunk.line_haul_rate,
    };
    return standardizedData;
  }

  _flush(callback: TransformCallback): void {
    if (this.rowCount > 0) {
      const totalRow = {
        createdAt: '',
        loadNumber: 'Total',
        displayId: '',
        brokerName: '',
        clientName: '',
        arValue: this.totalArValue,
        lineHaulRate: this.totalLineHaulRate,
      };
      this.push(totalRow);
    }
    callback();
  }
}
