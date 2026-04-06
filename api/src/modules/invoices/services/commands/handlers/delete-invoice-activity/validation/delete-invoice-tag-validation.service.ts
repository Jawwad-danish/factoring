import { ValidationService } from '@core/validation';
import { InvoiceEntity } from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DeleteInvoiceTagValidationService extends ValidationService<
  [InvoiceEntity, string]
> {
  constructor() {
    super([]);
  }
}
