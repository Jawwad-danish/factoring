import { Injectable } from '@nestjs/common';
import { VerifyInvoiceRequest } from '../../../../../data';
import { InvoiceRuleService } from '../../common/rules/invoice-rule.service';

@Injectable()
export class VerifyInvoiceRuleService extends InvoiceRuleService<VerifyInvoiceRequest> {
  constructor() {
    super([]);
  }
}
