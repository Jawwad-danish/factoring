import { ActivityPayload } from './payload-types';

export interface BrokerPaymentNonFactoredActivityPayload
  extends ActivityPayload {
  data: {
    amount: number;
  };
}

export interface BrokerPaymentActivityPayload extends ActivityPayload {
  placeholders: {
    amount: string;
    type: string;
    batchDate: string;
  };
  data: {
    amount: number;
    type: string;
    batchDate: Date;
    brokerPaymentId?: string;
  };
}
