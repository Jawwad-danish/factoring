import { ValidationError } from '@core/validation';
import {
  BrokerPaymentContext,
  CreateBrokerPaymentRequest,
  DeleteBrokerPaymentRequest,
} from '../../../../../data';
import { BrokerPaymentValidator } from '../../../../common';
import { BasicEntityUtil } from '@module-persistence/util';

export class LastBrokerPaymentValidator
  implements BrokerPaymentValidator<DeleteBrokerPaymentRequest>
{
  async validate(
    context: BrokerPaymentContext<CreateBrokerPaymentRequest>,
  ): Promise<void> {
    const { invoice, brokerPayment } = context;
    const lastBrokerPayment = BasicEntityUtil.getLastActiveEntity(
      invoice.brokerPayments,
    );
    if (lastBrokerPayment && lastBrokerPayment.id !== brokerPayment.id) {
      throw new ValidationError(
        'last-broker-payment',
        `Cannot delete broker payment with id ${brokerPayment.id} because it's not the last one`,
      );
    }
  }
}
