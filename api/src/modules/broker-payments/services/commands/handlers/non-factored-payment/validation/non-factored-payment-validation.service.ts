import { Injectable } from '@nestjs/common';
import { CreateBrokerPaymentRequest } from '../../../../../data';
import { BrokerPaymentValidationService } from '../../../../common';
import { InvoiceStatusRejectedValidator } from './validators';

@Injectable()
export class NonFactoredPaymentValidationService extends BrokerPaymentValidationService<CreateBrokerPaymentRequest> {
  constructor(invoiceStatusRejectedValidator: InvoiceStatusRejectedValidator) {
    super([invoiceStatusRejectedValidator]);
  }
}
