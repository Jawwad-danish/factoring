import { Injectable } from '@nestjs/common';
import { CreateBrokerPaymentRequest } from '../../../../../data';
import { BrokerPaymentRuleService } from '../../../../common';
import { CreateBrokerPaymentReserveRule } from './create-broker-payment-reserve-rule';
import { CreateBrokerPaymentUpdateAssignmentRule } from './create-broker-payment-update-assignment-rule';
import { CreateBrokerPaymentUpdateInvoiceRule } from './create-broker-payment-update-invoice-rule';

@Injectable()
export class CreateBrokerPaymentRuleService extends BrokerPaymentRuleService<CreateBrokerPaymentRequest> {
  constructor(
    createReserveRule: CreateBrokerPaymentReserveRule,
    updateInvoiceRule: CreateBrokerPaymentUpdateInvoiceRule,
    updateAssignmentRule: CreateBrokerPaymentUpdateAssignmentRule,
  ) {
    super([createReserveRule, updateInvoiceRule, updateAssignmentRule]);
  }
}
