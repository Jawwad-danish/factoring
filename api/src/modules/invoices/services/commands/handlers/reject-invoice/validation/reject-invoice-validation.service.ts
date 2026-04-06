import { RejectInvoiceRequest } from '@module-invoices/data';
import { Injectable } from '@nestjs/common';
import { InvoiceValidationService } from '../../common/validation/invoice-validation.service';
import { InvoiceStatusToRejectedValidator } from './validators';

@Injectable()
export class RejectInvoiceValidationService extends InvoiceValidationService<RejectInvoiceRequest> {
  constructor(
    invoiceStatusToRejectedValidator: InvoiceStatusToRejectedValidator,
  ) {
    super([invoiceStatusToRejectedValidator]);
  }
}
