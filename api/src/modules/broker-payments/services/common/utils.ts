import {
  BrokerPaymentEntity,
  BrokerPaymentStatus,
  InvoiceEntity,
  TagDefinitionKey,
} from '@module-persistence/entities';
import { InvoiceEntityUtil } from '@module-persistence/util';

export const getTagDefinitionKey = (
  brokerPaymentStatus: BrokerPaymentStatus,
): TagDefinitionKey => {
  switch (brokerPaymentStatus) {
    case BrokerPaymentStatus.InFull:
      return TagDefinitionKey.BROKER_PAYMENT_IN_FULL;
    case BrokerPaymentStatus.ShortPaid:
      return TagDefinitionKey.BROKER_PAYMENT_SHORTPAY;
    case BrokerPaymentStatus.Overpaid:
      return TagDefinitionKey.BROKER_PAYMENT_OVERPAY;
    case BrokerPaymentStatus.NonPayment:
      return TagDefinitionKey.BROKER_PAYMENT_NON_PAYMENT;
    case BrokerPaymentStatus.NonFactoredPayment:
      return TagDefinitionKey.BROKER_PAYMENT_NON_FACTORED;
    case BrokerPaymentStatus.NotReceived:
    default:
      return TagDefinitionKey.BROKER_PAYMENT_NOT_RECEIVED;
  }
};

export const getPaymentType = async (
  invoice: InvoiceEntity,
  brokerPayment: BrokerPaymentEntity,
): Promise<BrokerPaymentStatus> => {
  return InvoiceEntityUtil.calculateBrokerPaymentStatus(invoice, brokerPayment);
};
