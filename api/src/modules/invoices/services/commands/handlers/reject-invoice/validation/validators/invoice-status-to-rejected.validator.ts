import { getUTCDate } from '@core/date-time';
import { ValidationError } from '@core/validation';
import {
  CommandInvoiceContext,
  RejectInvoiceRequest,
} from '@module-invoices/data';
import { InvoiceStatus } from '@module-persistence/entities';
import { Logger } from '@nestjs/common';
import { RejectInvoiceValidator } from './reject-invoice-validator';

export class InvoiceStatusToRejectedValidator
  implements RejectInvoiceValidator
{
  private logger: Logger = new Logger(InvoiceStatusToRejectedValidator.name);

  async validate(
    context: CommandInvoiceContext<RejectInvoiceRequest>,
  ): Promise<void> {
    const { entity } = context;

    if (entity.status === InvoiceStatus.Purchased) {
      this.logger.error(
        `Cannot reject invoice id ${entity.id}. Already purchased.`,
      );
      throw new ValidationError(
        'invoice-status-to-rejected',
        'Cannot reject an already purchased invoice.',
      );
    }

    if (entity.status === InvoiceStatus.Rejected) {
      this.logger.error(
        `Cannot reject invoice id ${entity.id}. Already rejected.`,
      );
      throw new ValidationError(
        'invoice-status-to-rejected',
        `This invoice was already rejected by ${entity.updatedBy?.firstName} ${
          entity.updatedBy?.lastName ? entity.updatedBy.lastName : ''
        } on ${getUTCDate(entity.updatedAt)}`,
      );
    }
  }
}
