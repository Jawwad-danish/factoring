import { Injectable } from '@nestjs/common';
import { RevertInvoiceRequest } from '../../../../../data';
import { InvoiceValidationService } from '../../common/validation/invoice-validation.service';
import { InvoiceNotDeletedValidator } from '../../common/validation/validators';
import { InvoiceStatusToUnderReviewValidator } from './validators';

@Injectable()
export class RevertInvoiceValidationService extends InvoiceValidationService<RevertInvoiceRequest> {
  constructor() {
    super([
      new InvoiceNotDeletedValidator(),
      new InvoiceStatusToUnderReviewValidator(),
    ]);
  }
}
