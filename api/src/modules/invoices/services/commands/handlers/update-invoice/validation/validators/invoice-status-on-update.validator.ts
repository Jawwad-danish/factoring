import { ValidationError } from '@core/validation';
import {
  CommandInvoiceContext,
  UpdateInvoiceRequest,
} from '@module-invoices/data';
import { InvoiceStatus } from '@module-persistence/entities';
import { Injectable, Logger } from '@nestjs/common';
import { UpdateInvoiceValidator } from './update-invoice-validator';

@Injectable()
export class InvoiceStatusOnUpdateValidator implements UpdateInvoiceValidator {
  private logger = new Logger(InvoiceStatusOnUpdateValidator.name);

  async validate(
    context: CommandInvoiceContext<UpdateInvoiceRequest>,
  ): Promise<void> {
    const { entity } = context;

    if (entity.status === InvoiceStatus.Rejected) {
      this.logger.error(`Can't update a invoice that is rejected`, {
        invoiceId: entity.id,
      });
      throw new ValidationError(
        'update-rejected-invoice',
        `Can't update a invoice that is rejected`,
      );
    }
  }
}
