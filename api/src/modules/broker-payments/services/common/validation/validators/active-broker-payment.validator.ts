import { ActiveEntityValidator } from '@common';
import { BrokerPaymentContext } from '../../../../data';

export class ActiveBrokerPaymentValidator<
  REQUEST,
> extends ActiveEntityValidator<BrokerPaymentContext<REQUEST>> {
  constructor() {
    super((context) => context.brokerPayment);
  }
}
