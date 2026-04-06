import {
  BrokerPaymentEntity,
  BrokerPaymentType,
} from '@module-persistence/entities';
import Big from 'big.js';

function mapType(brokerPayment: any): BrokerPaymentType {
  const type = brokerPayment.transaction_type as string;
  switch (type) {
    case 'lockbox':
      return BrokerPaymentType.Check;
    case 'ach':
    default:
      return BrokerPaymentType.Ach;
  }
}

export const buildEntity = (brokerPayment: any): BrokerPaymentEntity => {
  const entity = new BrokerPaymentEntity();
  entity.id = brokerPayment.id;
  entity.amount = Big(brokerPayment.amount);
  entity.checkNumber = brokerPayment.check_number;
  entity.batchDate = brokerPayment.batch_date || new Date();
  entity.type = mapType(brokerPayment);
  entity.createdAt = brokerPayment.created_at;
  entity.updatedAt = brokerPayment.updated_at;
  return entity;
};
