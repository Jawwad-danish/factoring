import {
  ClientBatchPaymentEntity,
  InvoiceEntity,
} from '@module-persistence/entities';

export interface ClientBatchPaymentContext<P> {
  entity: ClientBatchPaymentEntity;
  payload: P;
  data: Record<string, any>;
  invoiceList: InvoiceEntity[];
  paymentExists: boolean;
}
