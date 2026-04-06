import { UpdateBrokerPaymentRequest } from '@module-broker-payments/data';
import { Injectable } from '@nestjs/common';
import { BrokerPaymentRuleService } from '../../../../common';
import { UpdateBrokerPaymentUpdateInvoiceActivityRule } from './update-broker-payment-invoice-activity.rule';

@Injectable()
export class UpdateBrokerPaymentRuleService extends BrokerPaymentRuleService<UpdateBrokerPaymentRequest> {
  constructor(
    updateInvoiceActivityLogRule: UpdateBrokerPaymentUpdateInvoiceActivityRule,
  ) {
    super([updateInvoiceActivityLogRule]);
  }
}
