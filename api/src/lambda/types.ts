import { Client } from '../modules/clients/data';
import { Broker } from '../modules/brokers/data/model';

export type DocumentPayload = {
  id?: string;
  name: string;
  type: string;
  internalUrl: string;
  externalUrl: string | null;
  options?: {
    sendDocumentAfterProcessingFlag?: boolean;
  };
};

export type LambdaClient = Pick<
  Client,
  'name' | 'mc' | 'doingBusinessAs' | 'dot'
>;

export type LambdaBroker = Pick<
  Broker,
  'addresses' | 'doingBusinessAs' | 'mc' | 'dot' | 'legalName'
>;

export type LambdaInvoice = {
  id: string;
  createdAt: string;
  loadNumber: string;
  displayId: string;
  lineHaulRate: number;
  lumper: number;
  detention: number;
  advance: number;
  note?: string;
  totalAmount: number;
  broker: LambdaBroker | null;
  client?: LambdaClient;
  documents: DocumentPayload[];
  sendDocumentAfterProcessingFlag: boolean;
};

export type InvoiceCoverResultPayload = {
  coverDocumentUrl: string;
};

export type CombineResultPayload = LambdaInvoice & {
  documentCombinedUrl: string;
};

export type LambdaInput<T> = {
  body: T;
  headers: Record<string, any>;
};
