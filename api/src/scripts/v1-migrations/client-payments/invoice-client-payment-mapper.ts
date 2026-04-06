import { InvoiceClientPaymentEntity } from '@module-persistence/entities';
import Big from 'big.js';

export const buildInvoiceClientPaymentEntity = (
  clientPayment: any,
  amount: Big,
): InvoiceClientPaymentEntity => {
  const entity = new InvoiceClientPaymentEntity();
  entity.amount = amount;
  entity.createdAt = clientPayment.created_at;
  entity.updatedAt = clientPayment.updated_at;
  return entity;
};
