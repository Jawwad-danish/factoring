import { CreateInvoiceRequest } from '@fs-bobtail/factoring/data';
import { Injectable } from '@nestjs/common';
import {
  ClientFactoringStatusRule,
  LowBrokerCreditRatingTagRule,
  MissingDeliveryOptionsRule,
  PossibleDuplicateRule,
  TagOnholdClientInvoiceRule,
  VerificationRequiredRule,
} from '../../common/rules';
import { InvoiceRuleService } from '../../common/rules/invoice-rule.service';
import { CreateInvoiceBrokerNotFoundActivityRule } from './broker-not-found-activity-rule';
import { CreateInvoiceActivityRule } from './create-invoice-activity-rule';
import { TagBrokerLimitRule } from './tag-broker-limit-rule';
import { TagClientLimitRule } from './tag-client-limit-rule';

@Injectable()
export class CreateInvoiceRuleService extends InvoiceRuleService<CreateInvoiceRequest> {
  constructor(
    createInvoiceRule: CreateInvoiceActivityRule,
    brokerNotFoundTagRule: CreateInvoiceBrokerNotFoundActivityRule,
    possibleDuplicateRule: PossibleDuplicateRule<CreateInvoiceRequest>,
    lowCreditBrokerRule: LowBrokerCreditRatingTagRule<CreateInvoiceRequest>,
    missingDeliveryOptionsRule: MissingDeliveryOptionsRule<CreateInvoiceRequest>,
    verificationRequiredRule: VerificationRequiredRule<CreateInvoiceRequest>,
    tagOnholdClientInvoiceRule: TagOnholdClientInvoiceRule,
    clientStatusIssueRule: ClientFactoringStatusRule<CreateInvoiceRequest>,
    tagClientLimitRule: TagClientLimitRule,
    tagBrokerLimitRule: TagBrokerLimitRule,
  ) {
    super([
      createInvoiceRule,
      brokerNotFoundTagRule,
      possibleDuplicateRule,
      lowCreditBrokerRule,
      missingDeliveryOptionsRule,
      verificationRequiredRule,
      tagOnholdClientInvoiceRule,
      clientStatusIssueRule,
      tagClientLimitRule,
      tagBrokerLimitRule,
    ]);
  }
}
