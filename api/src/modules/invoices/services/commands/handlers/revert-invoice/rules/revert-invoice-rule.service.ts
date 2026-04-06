import { Injectable } from '@nestjs/common';
import { RevertInvoiceRequest } from '../../../../../data';
import { InvoiceRuleService } from '../../common/rules/invoice-rule.service';
import { RevertInvoiceUpdateClientPaymentStatusRule } from './revert-invoice-update-client-payment-status.rule';
import { RevertInvoiceReserveFeeRule } from './revert-reserve-fee.rule';
import { RevertDeductionReserveRule } from './revert-deduction-reserve-rule';
import {
  ClientFactoringStatusRule,
  LowBrokerCreditRatingTagRule,
  MissingDeliveryOptionsRule,
  PossibleDuplicateRule,
  TagOnholdClientInvoiceRule,
  VerificationRequiredRule,
} from '../../common/rules';

@Injectable()
export class RevertInvoiceRuleService extends InvoiceRuleService<RevertInvoiceRequest> {
  constructor(
    revertInvoiceUpdateClientPaymentStatusRule: RevertInvoiceUpdateClientPaymentStatusRule,
    revertReserveFee: RevertInvoiceReserveFeeRule,
    revertDeductionReserveRule: RevertDeductionReserveRule,
    possibleDuplicateRule: PossibleDuplicateRule<RevertInvoiceRequest>,
    lowCreditBrokerRule: LowBrokerCreditRatingTagRule<RevertInvoiceRequest>,
    missingDeliveryOptionsRule: MissingDeliveryOptionsRule<RevertInvoiceRequest>,
    verificationRequiredRule: VerificationRequiredRule<RevertInvoiceRequest>,
    tagOnholdClientInvoiceRule: TagOnholdClientInvoiceRule,
    clientStatusIssueRule: ClientFactoringStatusRule<RevertInvoiceRequest>,
  ) {
    super([
      revertInvoiceUpdateClientPaymentStatusRule,
      revertReserveFee,
      revertDeductionReserveRule,
      possibleDuplicateRule,
      lowCreditBrokerRule,
      missingDeliveryOptionsRule,
      verificationRequiredRule,
      tagOnholdClientInvoiceRule,
      clientStatusIssueRule,
    ]);
  }
}
