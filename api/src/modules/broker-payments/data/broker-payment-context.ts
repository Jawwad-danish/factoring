import {
  BrokerPaymentEntity,
  InvoiceEntity,
} from '@module-persistence/entities';

export interface BrokerPaymentContext<TRequest> {
  brokerPayment: BrokerPaymentEntity;
  request: TRequest;
  invoice: InvoiceEntity;
}
