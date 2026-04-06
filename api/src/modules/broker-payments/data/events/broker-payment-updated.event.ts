import { BaseModel } from '@core/data';
import { BrokerPaymentEntity } from '@module-persistence/entities';

export interface BrokerPaymentState
  extends Pick<BrokerPaymentEntity, 'batchDate' | 'checkNumber' | 'type'> {}

export class BrokerPaymentUpdatedEvent extends BaseModel<BrokerPaymentUpdatedEvent> {
  static readonly EVENT_NAME: string = 'broker-payment.updated';

  constructor(
    readonly brokerPaymentId: string,
    readonly previousState: BrokerPaymentState,
  ) {
    super();
  }
}
