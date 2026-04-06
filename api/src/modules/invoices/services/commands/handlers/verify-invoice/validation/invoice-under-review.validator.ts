import { ValidationError } from '@core/validation';
import {
  CommandInvoiceContext,
  VerifyInvoiceRequest,
} from '@module-invoices/data';
import { InvoiceStatus } from '@module-persistence/entities';
import { Logger } from '@nestjs/common';
import { VerifyInvoiceValidator } from './verify-invoice-validator';

export class InvoiceUnderReviewValidator implements VerifyInvoiceValidator {
  private logger = new Logger(InvoiceUnderReviewValidator.name);

  async validate(
    context: CommandInvoiceContext<VerifyInvoiceRequest>,
  ): Promise<void> {
    const { entity } = context;

    if (entity.status !== InvoiceStatus.UnderReview) {
      this.logger.error(
        `Invoice cannot be verified because it's not under review`,
        {
          invoiceId: entity.id,
          status: entity.status,
        },
      );
      throw new ValidationError(
        'invoice-under-review',
        'Cannot verify an invoice that is not under review',
      );
    }
  }
}
