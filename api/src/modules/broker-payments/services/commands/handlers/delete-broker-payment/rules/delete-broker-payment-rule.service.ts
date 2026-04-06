import { Injectable } from '@nestjs/common';
import { DeleteBrokerPaymentRequest } from '../../../../../data';
import { BrokerPaymentRuleService } from '../../../../common';
import { DeleteBrokerPaymentUpdateAssignmentRule } from './delete-broker-payment-assignment-update-rule';
import { DeleteBrokerPaymentReserveRule } from './delete-broker-payment-reserve-rule';
import { DeleteBrokerPaymentUpdateInvoiceRule } from './delete-broker-payment-update-invoice-rule';
@Injectable()
export class DeleteBrokerPaymentRuleService extends BrokerPaymentRuleService<DeleteBrokerPaymentRequest> {
  constructor(
    updateInvoiceRule: DeleteBrokerPaymentUpdateInvoiceRule,
    updateReservesRule: DeleteBrokerPaymentReserveRule,
    updateAssignmentRule: DeleteBrokerPaymentUpdateAssignmentRule,
  ) {
    super([updateInvoiceRule, updateReservesRule, updateAssignmentRule]);
  }
}
