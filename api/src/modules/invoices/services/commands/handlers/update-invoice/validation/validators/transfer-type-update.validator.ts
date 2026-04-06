import { ValidationError } from '@core/validation';
import { ClientPaymentStatus } from '@module-persistence/entities';
import { Injectable, Logger } from '@nestjs/common';
import {
  CommandInvoiceContext,
  UpdateInvoiceRequest,
} from '../../../../../../data';
import { UpdateInvoiceValidator } from './update-invoice-validator';

@Injectable()
export class TransferTypeUpdateValidator implements UpdateInvoiceValidator {
  private logger = new Logger(TransferTypeUpdateValidator.name);

  async validate(
    context: CommandInvoiceContext<UpdateInvoiceRequest>,
  ): Promise<void> {
    const { entity, payload } = context;
    if (
      payload.expedited === undefined ||
      payload.expedited === entity.expedited
    ) {
      return;
    }

    if (
      entity.clientPaymentStatus === ClientPaymentStatus.Sent ||
      entity.clientPaymentStatus === ClientPaymentStatus.Completed
    ) {
      this.logger.error(
        `Cannot update transfer type of the invoice that was already paid to the client.`,
        {
          invoiceId: entity.id,
        },
      );
      throw new ValidationError(
        'transfer-type-update',
        'Cannot update transfer type of an invoice that was already paid to the client.',
      );
    }
  }
}
