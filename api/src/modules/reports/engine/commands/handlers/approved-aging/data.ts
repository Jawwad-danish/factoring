import { Broker } from '@module-brokers';
import { Client } from '@module-clients';

export interface ApprovedAgingData {
  createdAt: Date;
  loadNumber: string;
  displayId: string;
  clientName: string;
  brokerName: string;
  arValue: number;
  lineHaulRate: number;
}

export type ClientLite = Pick<Client, 'id' | 'name' | 'mc'>;
export type BrokerLite = Pick<Broker, 'id' | 'legalName' | 'mc'>;

export interface ClientsAndBrokersMapping {
  clients: Map<string, ClientLite>;
  brokers: Map<string, BrokerLite>;
}
