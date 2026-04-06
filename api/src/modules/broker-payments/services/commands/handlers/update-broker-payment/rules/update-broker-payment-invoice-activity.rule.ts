import { ChangeActions } from '@common';
import { Note } from '@core/data';
import { formatToDollars, monthDayYear } from '@core/formatting';
import { penniesToDollars } from '@core/formulas';
import {
  BrokerPaymentContext,
  UpdateBrokerPaymentRequest,
} from '@module-broker-payments/data';
import { TagDefinitionKey } from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';
import { BrokerPaymentRule } from '../../../../common';

@Injectable()
export class UpdateBrokerPaymentUpdateInvoiceActivityRule
  implements BrokerPaymentRule<UpdateBrokerPaymentRequest>
{
  async run(
    context: BrokerPaymentContext<UpdateBrokerPaymentRequest>,
  ): Promise<ChangeActions> {
    const { brokerPayment } = context;

    return ChangeActions.addTagAndActivity(
      TagDefinitionKey.BROKER_PAYMENT_UPDATE,
      Note.fromText(
        `Payment updated: ${formatToDollars(
          penniesToDollars(brokerPayment.amount),
        )} via ${brokerPayment.type}, batch date ${monthDayYear(
          brokerPayment.batchDate,
        )}`,
      ),
    );
  }
}
