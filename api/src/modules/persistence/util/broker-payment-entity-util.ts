import Big from 'big.js';
import { BrokerPaymentEntity } from '../entities';

export class BrokerPaymentEntityUtil {
  static total(brokerPayments: BrokerPaymentEntity[]): Big {
    return brokerPayments
      .map((payment) => payment.amount)
      .reduce((total, item) => total.plus(item), new Big(0));
  }
}
