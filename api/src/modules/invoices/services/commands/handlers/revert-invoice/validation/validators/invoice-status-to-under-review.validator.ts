import { ValidationError } from '@core/validation';
import {
  CommandInvoiceContext,
  RevertInvoiceRequest,
} from '@module-invoices/data';
import {
  ClientPaymentStatus,
  InvoiceStatus,
} from '@module-persistence/entities';
import { Logger } from '@nestjs/common';
import { RevertInvoiceValidator } from './revert-invoice-validator';

export class InvoiceStatusToUnderReviewValidator
  implements RevertInvoiceValidator
{
  private logger: Logger = new Logger(InvoiceStatusToUnderReviewValidator.name);
  async validate(
    context: CommandInvoiceContext<RevertInvoiceRequest>,
  ): Promise<void> {
    const { entity } = context;

    if (
      entity.status === InvoiceStatus.Purchased &&
      (entity.clientPaymentStatus === ClientPaymentStatus.Sent ||
        entity.clientPaymentStatus === ClientPaymentStatus.Completed)
    ) {
      this.logger.error(
        `Cannot revert invoice id ${entity.id}. It was already paid to client.`,
      );
      throw new ValidationError(
        'invoice-status-to-under-review',
        'Cannot revert an invoice which was already paid to client.',
      );
    }
  }
}
