import { BrokerPaymentHistoryEntity } from './broker-payment-history.entity';
import { ClientFactoringConfigsHistoryEntity } from './client-factoring-config-history.entity';
import { InvoiceHistoryEntity } from './invoice-history.entity';
import { UserHistoryEntity } from './user-history.entity';

export * from './broker-payment-history.entity';
export * from './client-factoring-config-history.entity';
export * from './history-factory';
export * from './history.entity';
export * from './invoice-history.entity';
export * from './user-history.entity';

export const historyRegistry = [
  BrokerPaymentHistoryEntity,
  ClientFactoringConfigsHistoryEntity,
  InvoiceHistoryEntity,
  UserHistoryEntity,
];
