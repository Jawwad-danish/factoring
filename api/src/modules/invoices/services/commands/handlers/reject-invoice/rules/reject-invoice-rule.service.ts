import { Injectable } from '@nestjs/common';
import { RejectInvoiceRequest } from '@module-invoices/data';
import { InvoiceRuleService } from '../../common/rules/invoice-rule.service';
import { TagRejectedInvoiceRule } from './tag-rejected-invoice.rule';

@Injectable()
export class RejectInvoiceRuleService extends InvoiceRuleService<RejectInvoiceRequest> {
  constructor(tagRejectedInvoiceRule: TagRejectedInvoiceRule) {
    super([tagRejectedInvoiceRule]);
  }
}
