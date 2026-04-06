import { Injectable } from '@nestjs/common';
import { DeleteBrokerPaymentRequest } from '../../../../../data';
import {
  ActiveBrokerPaymentValidator,
  BrokerPaymentValidationService,
} from '../../../../common';
import { LastBrokerPaymentValidator } from './last-broker-payment.validator';

@Injectable()
export class DeleteBrokerPaymentValidationService extends BrokerPaymentValidationService<DeleteBrokerPaymentRequest> {
  constructor() {
    super([
      new ActiveBrokerPaymentValidator(),
      new LastBrokerPaymentValidator(),
    ]);
  }
}
