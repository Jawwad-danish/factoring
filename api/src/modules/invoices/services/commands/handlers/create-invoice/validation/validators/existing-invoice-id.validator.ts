import { ValidationError } from '@core/validation';
import { CreateInvoiceRequest } from '@fs-bobtail/factoring/data';
import { InvoiceRepository } from '@module-persistence/repositories';
import { Injectable, Logger } from '@nestjs/common';
import { CommandInvoiceContext } from '../../../../../../data';
import { CreateInvoiceValidator } from './create-invoice-validator';

@Injectable()
export class ExistingInvoiceIdValidator implements CreateInvoiceValidator {
  private logger = new Logger(ExistingInvoiceIdValidator.name);

  constructor(private invoiceRepository: InvoiceRepository) {}

  async validate(
    context: CommandInvoiceContext<CreateInvoiceRequest>,
  ): Promise<void> {
    const { payload } = context;
    if (payload.id) {
      const found = await this.invoiceRepository.anyMatchById(payload.id);
      if (found) {
        this.logger.error(
          `Could not create invoice because id already exists`,
          {
            loadNumber: payload.loadNumber,
            id: payload.id,
          },
        );
        throw new ValidationError(
          'existing-invoice-id',
          `Could not create invoice with load number ${payload.loadNumber} because id ${payload.id} already exists.`,
        );
      }
    }
  }
}
