import { ChangeActions } from '@common';
import { Assignment, AssignmentResult, Note } from '@core/data';
import { formatToDollars, monthDayYear } from '@core/formatting';
import { penniesToDollars } from '@core/formulas';
import { TagDefinitionKey } from '@module-persistence/entities';
import { BasicEntityUtil, InvoiceEntityUtil } from '@module-persistence/util';
import { Injectable } from '@nestjs/common';
import {
  BrokerPaymentContext,
  DeleteBrokerPaymentRequest,
} from '../../../../../data';
import { BrokerPaymentRule, getPaymentType } from '../../../../common';

@Injectable()
export class DeleteBrokerPaymentUpdateInvoiceRule
  implements BrokerPaymentRule<DeleteBrokerPaymentRequest>
{
  async run({
    invoice,
    brokerPayment,
  }: BrokerPaymentContext<DeleteBrokerPaymentRequest>): Promise<ChangeActions> {
    const brokerPaymentStatus = await getPaymentType(invoice, brokerPayment);
    const activeBrokerPayments =
      await InvoiceEntityUtil.getActiveBrokerPayments(invoice);
    const paymentDate =
      activeBrokerPayments.length === 0
        ? null
        : BasicEntityUtil.getFirstActiveEntity(activeBrokerPayments)?.createdAt;

    const assignmentResult = AssignmentResult.merge([
      Assignment.assign(invoice, 'brokerPaymentStatus', brokerPaymentStatus),
      Assignment.assign(invoice, 'paymentDate', paymentDate),
    ]);

    return ChangeActions.addTagAndActivity(
      TagDefinitionKey.BROKER_PAYMENT_DELETE,
      Note.from({
        payload: assignmentResult.getPayload(),
        text: `Payment removed: ${formatToDollars(
          penniesToDollars(brokerPayment.amount),
        )} via ${brokerPayment.type}, batch date ${monthDayYear(
          brokerPayment.batchDate,
        )}`,
      }),
    );
  }
}
