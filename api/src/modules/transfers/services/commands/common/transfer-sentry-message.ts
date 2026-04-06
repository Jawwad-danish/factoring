import { formatToDollars } from '@core/formatting';
import { penniesToDollars } from '@core/formulas';
import { Observability } from '@core/observability';
import { Maps } from '@core/util';
import Big from 'big.js';
import { PaymentContext } from './transfer-data.mapper';

export class TransferSentryMessage {
  static async captureTransferSentryMessage(
    clientPayments: Map<string, PaymentContext>,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const result = Maps.transform(clientPayments, (_, paymentContext) => {
      const amount = penniesToDollars(paymentContext.clientPayment.amount);
      const context = {};
      if (paymentContext.clientPayment.invoicePayments?.isInitialized()) {
        for (const invoicePayment of paymentContext.clientPayment
          .invoicePayments) {
          context[`invoice ${invoicePayment.invoice.id}`] = `${formatToDollars(
            penniesToDollars(invoicePayment.amount),
          )} paid to client: ${invoicePayment.clientPayment.clientId}`;
        }
      }
      if (paymentContext.clientPayment.reservePayments?.isInitialized()) {
        for (const reservePayment of paymentContext.clientPayment
          .reservePayments) {
          context[`reserve ${reservePayment.reserve?.id}`] = `${formatToDollars(
            penniesToDollars(reservePayment.amount),
          )} paid to client: ${reservePayment.clientPayment?.clientId}`;
        }
      }
      return { context, amount };
    });
    const totalDollars = result.reduce(
      (total, item) => item.amount.plus(total),
      new Big(0),
    );
    let context = {};
    result.forEach((item) => (context = { ...context, ...item.context }));

    const messageToCapture = `Bobtail Transfer
        Sending ${formatToDollars(totalDollars)} for ${
      clientPayments.size
    } clients.
    `;

    Observability.captureMessage(messageToCapture, { extra: context });
  }
}
