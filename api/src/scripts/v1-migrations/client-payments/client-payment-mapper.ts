import {
  ClientBatchPaymentEntity,
  ClientBatchPaymentStatus,
  ClientPaymentEntity,
  ClientPaymentOperationType,
  ClientPaymentType,
  PaymentStatus,
} from '@module-persistence/entities';
import Big from 'big.js';
import { getSystemID } from '../../util';

function mapStatus(
  clientBatchPaymentEntity: ClientBatchPaymentEntity,
): PaymentStatus {
  switch (clientBatchPaymentEntity.status) {
    case ClientBatchPaymentStatus.Done:
      return PaymentStatus.DONE;
    case ClientBatchPaymentStatus.InProgress:
    case ClientBatchPaymentStatus.Pending:
      return PaymentStatus.PENDING;
    default:
      return PaymentStatus.FAILED;
  }
}

export const buildEntity = (
  clientPayment: any,
  clientBatchPaymentEntity: ClientBatchPaymentEntity,
): ClientPaymentEntity => {
  const entity = new ClientPaymentEntity();
  entity.id = clientPayment.id;
  entity.amount = Big(clientPayment.amount);
  entity.clientId = clientPayment.client_id;
  entity.transferFee = Big(clientPayment.fee);
  entity.batchPayment = clientBatchPaymentEntity;
  entity.createdAt = clientPayment.created_at;
  entity.createdBy = clientPayment.created_by ?? getSystemID();
  entity.updatedAt = clientPayment.updated_at;
  entity.updatedBy = clientPayment.updated_by ?? getSystemID();
  entity.transferType = clientBatchPaymentEntity.type;
  entity.status = mapStatus(clientBatchPaymentEntity);
  entity.clientBankAccountId =
    clientPayment.clientaccountpayments[0].client_bank_account_id;
  entity.bankAccountLastDigits = clientPayment.metadata?.last_4 ?? '';
  if (clientPayment.invoices) {
    entity.type = ClientPaymentType.Invoice;
  } else if (clientPayment.balances) {
    entity.type = ClientPaymentType.Reserve;
  } else {
    entity.type = ClientPaymentType.Other;
  }
  entity.operationType = ClientPaymentOperationType.Credit;
  return entity;
};
