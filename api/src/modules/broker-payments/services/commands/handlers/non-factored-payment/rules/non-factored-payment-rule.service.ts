import { Injectable } from '@nestjs/common';
import { CreateBrokerPaymentRequest } from '../../../../../data';
import { BrokerPaymentRuleService } from '../../../../common';
import { NonFactoredPaymentReserveRule } from './non-factored-payment-reserve-rule';
import { NonFactoredPaymentUpdateInvoiceRule } from './non-factored-payment-update-invoice-rule';

@Injectable()
export class NonFactoredPaymentPaymentRuleService extends BrokerPaymentRuleService<CreateBrokerPaymentRequest> {
  constructor(
    reserveRule: NonFactoredPaymentReserveRule,
    invoiceUpdateRule: NonFactoredPaymentUpdateInvoiceRule,
  ) {
    super([reserveRule, invoiceUpdateRule]);
  }
}
