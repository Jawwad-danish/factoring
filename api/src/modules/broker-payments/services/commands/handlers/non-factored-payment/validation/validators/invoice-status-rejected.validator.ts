import { ValidationError } from '@core/validation';
import { InvoiceStatus } from '@module-persistence';
import { Injectable, Logger } from '@nestjs/common';
import {
  BrokerPaymentContext,
  CreateBrokerPaymentRequest,
} from '../../../../../../data';
import { BrokerPaymentValidator } from '../../../../../common';

@Injectable()
export class InvoiceStatusRejectedValidator
  implements BrokerPaymentValidator<CreateBrokerPaymentRequest>
{
  private logger = new Logger(InvoiceStatusRejectedValidator.name);

  async validate(
    context: BrokerPaymentContext<CreateBrokerPaymentRequest>,
  ): Promise<void> {
    const { invoice } = context;

    if (invoice.status !== InvoiceStatus.Rejected) {
      this.logger.error(
        `Cannot add a non factored payment to an invoice that was not rejected`,
        {
          invoiceId: invoice.id,
          status: invoice.id,
        },
      );
      throw new ValidationError(
        'invoice-status-rejected',
        `Cannot add a non factored payment to an invoice that was not rejected`,
      );
    }
  }
}
