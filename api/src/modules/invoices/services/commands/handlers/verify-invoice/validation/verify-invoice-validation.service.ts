import { Injectable } from '@nestjs/common';
import { VerifyInvoiceRequest } from '@module-invoices/data';
import { InvoiceNotDeletedValidator } from '../../common/validation/validators';

import { InvoiceValidationService } from '../../common/validation';
import { InvoiceUnderReviewValidator } from './invoice-under-review.validator';

@Injectable()
export class VerifyInvoiceValidationService extends InvoiceValidationService<VerifyInvoiceRequest> {
  constructor() {
    super([
      new InvoiceNotDeletedValidator(),
      new InvoiceUnderReviewValidator(),
    ]);
  }
}
