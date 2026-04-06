import { getUTCDate } from '@core/date-time';
import { ValidationError } from '@core/validation';
import {
  CommandInvoiceContext,
  PurchaseInvoiceRequest,
} from '@module-invoices/data';
import { InvoiceStatus } from '@module-persistence/entities';
import { Logger } from '@nestjs/common';
import { PurchaseInvoiceValidator } from './purchase-invoice-validator';

export class InvoiceStatusToPurchasedValidator
  implements PurchaseInvoiceValidator
{
  private logger: Logger = new Logger(InvoiceStatusToPurchasedValidator.name);

  async validate(
    context: CommandInvoiceContext<PurchaseInvoiceRequest>,
  ): Promise<void> {
    const { entity, broker } = context;

    if (entity.status === InvoiceStatus.Rejected) {
      this.logger.error('Cannot purchase a rejected invoice', {
        invoiceId: entity.id,
        status: entity.status,
      });
      throw new ValidationError(
        'invoice-status-to-purchase',
        'Cannot purchase a rejected invoice',
      );
    }

    if (entity.status === InvoiceStatus.Purchased) {
      this.logger.warn(`Invoice is already in purchased state.`, {
        invoiceId: entity.id,
      });
      throw new ValidationError(
        'invoice-status-to-purchase',
        `This invoice was already purchased by ${entity.updatedBy?.firstName} ${
          entity.updatedBy?.lastName ? entity.updatedBy.lastName : ''
        } on ${getUTCDate(entity.updatedAt)}`,
      );
    }

    if (broker == null) {
      this.logger.error('Cannot purchase an invoice with no broker', {
        invoiceId: entity.id,
      });
      throw new ValidationError(
        'invoice-status-to-purchase',
        'Cannot purchase an invoice with no broker',
      );
    }
  }
}
