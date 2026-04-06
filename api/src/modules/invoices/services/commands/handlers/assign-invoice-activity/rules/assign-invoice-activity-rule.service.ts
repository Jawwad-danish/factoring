import { Injectable } from '@nestjs/common';
import { AssignInvoiceActivityRequest } from '../../../../../data';
import { BrokerPaymentScheduledRule } from './broker-payment-scheduled-rule';
import { InvoiceActivityRuleService } from '../../common';

@Injectable()
export class AssignInvoiceActivityRuleService extends InvoiceActivityRuleService<AssignInvoiceActivityRequest> {
  constructor(brokerPaymentScheduledRule: BrokerPaymentScheduledRule) {
    super([brokerPaymentScheduledRule]);
  }
}
