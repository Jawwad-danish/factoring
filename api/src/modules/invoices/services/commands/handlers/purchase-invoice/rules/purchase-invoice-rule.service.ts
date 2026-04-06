import { Injectable } from '@nestjs/common';
import { PurchaseInvoiceRequest } from '../../../../../data';
import { ClientBrokerAssignmentRule } from '../../common/rules';
import { InvoiceRuleService } from '../../common/rules/invoice-rule.service';
import { PurchaseDeductionRule } from './purchase-deduction-rule';
import { ReserveFeeRule } from './reserve-fee-rule';
import { ResolveTagsRule } from './resolve-tags-rule';
import { TagUploadToPortalRule } from './tag-upload-to-portal-rule';
import { WireDeadlineRule } from './wire-deadline-rule';
import { ConvertToExpeditedRule } from './convert-to-expedited-rule';

@Injectable()
export class PurchaseInvoiceRuleService extends InvoiceRuleService<PurchaseInvoiceRequest> {
  constructor(
    wireDeadlineRule: WireDeadlineRule,
    purchaseDeductionRule: PurchaseDeductionRule,
    clientBrokerAssignmentRule: ClientBrokerAssignmentRule,
    tagUploadToPortalRule: TagUploadToPortalRule,
    reserveFeeRule: ReserveFeeRule,
    resolveTagsRule: ResolveTagsRule,
    convertToExpeditedRule: ConvertToExpeditedRule,
  ) {
    super([
      convertToExpeditedRule,
      wireDeadlineRule,
      purchaseDeductionRule,
      clientBrokerAssignmentRule,
      resolveTagsRule,
      reserveFeeRule,
      tagUploadToPortalRule,
    ]);
  }
}
