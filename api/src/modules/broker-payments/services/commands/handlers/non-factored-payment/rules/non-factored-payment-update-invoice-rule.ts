import { ActivityLogPayloadBuilder, ChangeActions } from '@common';
import { Note } from '@core/data';
import {
  BrokerPaymentStatus,
  TagDefinitionKey,
} from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';
import {
  BrokerPaymentContext,
  CreateBrokerPaymentRequest,
} from '../../../../../data';
import { BrokerPaymentRule } from '../../../../common';

@Injectable()
export class NonFactoredPaymentUpdateInvoiceRule
  implements BrokerPaymentRule<CreateBrokerPaymentRequest>
{
  async run({
    invoice,
    request,
  }: BrokerPaymentContext<CreateBrokerPaymentRequest>): Promise<ChangeActions> {
    invoice.brokerPaymentStatus = BrokerPaymentStatus.NonFactoredPayment;
    return ChangeActions.addTagAndActivity(
      TagDefinitionKey.BROKER_PAYMENT_NON_FACTORED,
      Note.fromPayload(
        ActivityLogPayloadBuilder.forKey(
          TagDefinitionKey.BROKER_PAYMENT_NON_FACTORED,
          {
            data: {
              amount: request.amount.toNumber(),
            },
          },
        ),
      ),
    );
  }
}
