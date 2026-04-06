import { ValidationError } from '@core/validation';
import {
  CommandInvoiceContext,
  UpdateInvoiceRequest,
} from '@module-invoices/data';
import { InvoiceStatus } from '@module-persistence/entities';
import { Injectable, Logger } from '@nestjs/common';
import { UpdateInvoiceValidator } from './update-invoice-validator';

@Injectable()
export class ClientUpdateOnPurchasedValidator<P extends UpdateInvoiceRequest>
  implements UpdateInvoiceValidator
{
  private logger = new Logger(ClientUpdateOnPurchasedValidator.name);

  async validate(context: CommandInvoiceContext<P>): Promise<void> {
    const { payload, entity } = context;

    if (
      payload.clientId &&
      payload.clientId != entity.clientId &&
      entity.status == InvoiceStatus.Purchased
    ) {
      this.logger.error(
        `Can't update a client for an already purchased invoice`,
        {
          invoiceId: entity.id,
        },
      );
      throw new ValidationError(
        'client-update-on-purchased',
        `Can't update a client for an already purchased invoice`,
      );
    }
  }
}
