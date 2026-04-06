import { Injectable } from '@nestjs/common';
import { UpdateBrokerPaymentRequest } from '../../../../../data';
import {
  ActiveBrokerPaymentValidator,
  BrokerPaymentValidationService,
} from '../../../../common';

@Injectable()
export class UpdateBrokerPaymentValidationService extends BrokerPaymentValidationService<UpdateBrokerPaymentRequest> {
  constructor() {
    super([new ActiveBrokerPaymentValidator()]);
  }
}
