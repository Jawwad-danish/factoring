import { Injectable } from '@nestjs/common';
import { UpdateInvoiceRule } from './create-client-batch-payment-update-invoice-rule';
import { CreateClientBatchPaymentRequest } from '../../../data';
import { ClientBatchPaymentRuleService } from '../../common/rules';
import { CreateClientBatchPaymentRule } from './create-client-batch-payment-rule';
import { UpdateClientFactoringConfigRule } from './create-client-batch-payment-update-client-factoring-config-rule';

@Injectable()
export class CreateClientBatchPaymentRuleService extends ClientBatchPaymentRuleService<CreateClientBatchPaymentRequest> {
  constructor(
    createClientBatchPaymentRule: CreateClientBatchPaymentRule,
    updateInvoicesAndPaymentsRule: UpdateInvoiceRule,
    updateClientFactoringConfigRule: UpdateClientFactoringConfigRule,
  ) {
    super([
      createClientBatchPaymentRule,
      updateInvoicesAndPaymentsRule,
      updateClientFactoringConfigRule,
    ]);
  }
}
