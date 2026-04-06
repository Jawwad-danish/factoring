import { CreateInvoiceRequest } from '@fs-bobtail/factoring/data';
import { Injectable } from '@nestjs/common';
import { InvoiceValidationService } from '../../common/validation/invoice-validation.service';
import { InvoiceExpeditedValidator } from '../../common/validation/validators';
import { ExistingInvoiceIdValidator } from './validators';

@Injectable()
export class CreateInvoiceValidationService extends InvoiceValidationService<CreateInvoiceRequest> {
  constructor(
    createExistingInvoiceValidator: ExistingInvoiceIdValidator,
    invoiceExpeditedValidator: InvoiceExpeditedValidator<CreateInvoiceRequest>,
  ) {
    super([createExistingInvoiceValidator, invoiceExpeditedValidator]);
  }
}
