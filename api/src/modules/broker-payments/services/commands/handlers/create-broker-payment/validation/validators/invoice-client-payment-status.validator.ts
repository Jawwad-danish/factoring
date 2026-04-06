import { isValidClientPaymentStatusForEditing } from '@common';
import { Injectable, Logger } from '@nestjs/common';
import { ValidationError } from '@core/validation';
import {
  BrokerPaymentContext,
  CreateBrokerPaymentRequest,
} from '../../../../../../data';
import { BrokerPaymentValidator } from '../../../../../common';
import { FeatureFlag, FeatureFlagResolver } from '@module-common';

@Injectable()
export class InvoiceClientPaymentStatusValidator
  implements BrokerPaymentValidator<CreateBrokerPaymentRequest>
{
  private logger = new Logger(InvoiceClientPaymentStatusValidator.name);

  constructor(private readonly featureFlagResolver: FeatureFlagResolver) {}

  async validate(
    context: BrokerPaymentContext<CreateBrokerPaymentRequest>,
  ): Promise<void> {
    if (
      !this.featureFlagResolver.isEnabled(
        FeatureFlag.BrokerPaymentInvoicePaidValidator,
      )
    ) {
      return;
    }
    const { invoice } = context;
    if (!isValidClientPaymentStatusForEditing(invoice.clientPaymentStatus)) {
      this.logger.error(
        `Cannot add a broker payment to an invoice that is not paid to the client`,
        {
          invoiceId: invoice.id,
          clientPaymentStatus: invoice.clientPaymentStatus,
        },
      );
      throw new ValidationError(
        'invoice-client-payment-status',
        `Cannot add a broker payment to an invoice that is not paid to the client`,
      );
    }
  }
}
