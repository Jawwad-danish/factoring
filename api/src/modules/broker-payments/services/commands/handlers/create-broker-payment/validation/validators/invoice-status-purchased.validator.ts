import { ValidationError } from '@core/validation';
import { InvoiceStatus } from '@module-persistence/entities';
import { Injectable, Logger } from '@nestjs/common';
import {
  BrokerPaymentContext,
  CreateBrokerPaymentRequest,
} from '../../../../../../data';
import { BrokerPaymentValidator } from '../../../../../common';

@Injectable()
export class InvoiceStatusPurchasedValidator
  implements BrokerPaymentValidator<CreateBrokerPaymentRequest>
{
  private logger = new Logger(InvoiceStatusPurchasedValidator.name);

  async validate({
    invoice,
  }: BrokerPaymentContext<CreateBrokerPaymentRequest>): Promise<void> {
    if (invoice.status !== InvoiceStatus.Purchased) {
      this.logger.error(
        `Cannot add broker payment because of invalid invoice status`,
        {
          invoiceId: invoice.id,
          status: invoice.id,
        },
      );
      throw new ValidationError(
        'invoice-status-purchased',
        `Cannot add a broker payment because of invalid invoice status`,
      );
    }
  }
}
