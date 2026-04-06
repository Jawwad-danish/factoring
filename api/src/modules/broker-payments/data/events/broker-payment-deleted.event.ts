import { BaseModel } from '@core/data';

export class BrokerPaymentDeletedEvent extends BaseModel<BrokerPaymentDeletedEvent> {
  static readonly EVENT_NAME: string = 'broker-payment.deleted';

  constructor(readonly brokerPaymentId: string) {
    super();
  }
}
