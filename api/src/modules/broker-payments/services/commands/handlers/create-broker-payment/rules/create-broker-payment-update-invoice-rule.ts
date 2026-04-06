import { ChangeActions, ChangeActor } from '@common';
import { Assignment, Note } from '@core/data';
import { formatToDollars, monthDayYear } from '@core/formatting';
import { penniesToDollars } from '@core/formulas';
import {
  BrokerPaymentStatus,
  TagDefinitionKey,
} from '@module-persistence/entities';
import { InvoiceEntityUtil } from '@module-persistence/util';
import { Injectable, Logger } from '@nestjs/common';
import {
  BrokerPaymentContext,
  CreateBrokerPaymentRequest,
} from '../../../../../data';
import { BrokerPaymentRule } from '../../../../common';
import { getTagDefinitionKey } from '../../../../common/utils';
import { getDateInBusinessTimezone } from '@core/date-time';

@Injectable()
export class CreateBrokerPaymentUpdateInvoiceRule
  implements BrokerPaymentRule<CreateBrokerPaymentRequest>
{
  private logger = new Logger(CreateBrokerPaymentUpdateInvoiceRule.name);

  async run(
    context: BrokerPaymentContext<CreateBrokerPaymentRequest>,
  ): Promise<ChangeActions> {
    const changeActions = ChangeActions.empty();
    changeActions.concat(await this.setPaymentDate(context));
    changeActions.concat(await this.setInvoiceBrokerPaymentStatus(context));
    return changeActions;
  }

  private async setPaymentDate({
    invoice,
  }: BrokerPaymentContext<CreateBrokerPaymentRequest>): Promise<ChangeActions> {
    if (invoice.paymentDate) {
      this.logger.debug('Payment date already set', {
        invoiceId: invoice.id,
      });
      return ChangeActions.empty();
    }

    const result = Assignment.assign(
      invoice,
      'paymentDate',
      getDateInBusinessTimezone().toDate(),
    );
    return ChangeActions.addActivity(
      TagDefinitionKey.UPDATE_INVOICE,
      Note.from({
        payload: result.getPayload(),
        text: 'Assigned initial broker payment date',
      }),
    );
  }

  private async setInvoiceBrokerPaymentStatus({
    invoice,
    request,
  }: BrokerPaymentContext<CreateBrokerPaymentRequest>): Promise<ChangeActions> {
    const brokerPaymentStatus =
      await InvoiceEntityUtil.calculateBrokerPaymentStatus(invoice);
    const assignmentResult = Assignment.assign(
      invoice,
      'brokerPaymentStatus',
      brokerPaymentStatus,
    );

    if (brokerPaymentStatus == BrokerPaymentStatus.NonPayment && request.tag) {
      return ChangeActions.addActivity(
        request.tag.key,
        Note.from({
          payload: assignmentResult.getPayload(),
          text: request.tag.note,
        }),
        { actor: ChangeActor.User },
      );
    }

    const tagDefinitionKey = getTagDefinitionKey(brokerPaymentStatus);
    return ChangeActions.addActivity(
      tagDefinitionKey,
      Note.from({
        payload: assignmentResult.getPayload(),
        text: `Payment posted for ${formatToDollars(
          penniesToDollars(request.amount),
        )} via ${request.type}, batch date ${monthDayYear(request.batchDate)}`,
      }),
    );
  }
}
