import { Injectable } from '@nestjs/common';
import { UpdateInvoiceRequest } from '../../../../../data';
import {
  ClientFactoringStatusRule,
  InvoiceRuleService,
  LowBrokerCreditRatingTagRule,
  MissingDeliveryOptionsRule,
  PossibleDuplicateRule,
  VerificationRequiredRule,
} from '../../common/rules';
import { UpdateInvoiceBrokerNotFoundActivityRule } from './broker-not-found-activity-rule';
import { ResolveTagsOnUpdateRule } from './resolve-tags-on-update-rule';

@Injectable()
export class UpdateInvoiceRuleService extends InvoiceRuleService<UpdateInvoiceRequest> {
  constructor(
    resolveTagsOnUpdateRule: ResolveTagsOnUpdateRule,
    updateInvoiceBrokerNotFoundActivityRule: UpdateInvoiceBrokerNotFoundActivityRule,
    missingDeliveryOptionsRule: MissingDeliveryOptionsRule<UpdateInvoiceRequest>,
    lowCreditBrokerRule: LowBrokerCreditRatingTagRule<UpdateInvoiceRequest>,
    possibleDuplicateRule: PossibleDuplicateRule<UpdateInvoiceRequest>,
    verificationRequiredRule: VerificationRequiredRule<UpdateInvoiceRequest>,
    clientStatusIssueRule: ClientFactoringStatusRule<UpdateInvoiceRequest>,
  ) {
    super([
      possibleDuplicateRule,
      resolveTagsOnUpdateRule,
      updateInvoiceBrokerNotFoundActivityRule,
      missingDeliveryOptionsRule,
      lowCreditBrokerRule,
      verificationRequiredRule,
      clientStatusIssueRule,
    ]);
  }
}
