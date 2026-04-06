import { BaseModel } from '@core/data';

export class BrokerPaymentCreatedEvent extends BaseModel<BrokerPaymentCreatedEvent> {
  static readonly EVENT_NAME: string = 'broker-payment.created';

  constructor(readonly brokerPaymentId: string) {
    super();
  }
}
