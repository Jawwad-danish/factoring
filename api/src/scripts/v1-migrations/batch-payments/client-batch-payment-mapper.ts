import {
  ClientBatchPaymentEntity,
  ClientBatchPaymentStatus,
  PaymentType,
} from '@module-persistence/entities';

function mapType(clientBatchPayment: any): PaymentType {
  const type = clientBatchPayment.transfer_type as string;
  switch (type) {
    case 'wire':
      return PaymentType.WIRE;
    case 'ach-debit':
      return PaymentType.DEBIT;
    case 'ach':
    default:
      return PaymentType.ACH;
  }
}

enum TransferStatus {
  NOT_SENT = 'not-sent-0-dollars',
  SENT = 'sent',
  DECLINED5 = 'declined5',
  DECLINED4 = 'declined4',
  DECLINED3 = 'declined3',
  DECLINED2 = 'declined2',
  DECLINED1 = 'declined1',
  IN_CALCULATION = 'in-calculation',
  ACCEPTED = 'accepted',
}

function mapStatus(clientBatchPayment: any): ClientBatchPaymentStatus {
  const status = clientBatchPayment.status as TransferStatus;
  switch (status) {
    case 'sent':
      return ClientBatchPaymentStatus.Done;
    case 'declined1':
    case 'declined2':
    case 'declined3':
    case 'declined4':
    case 'declined5':
      return ClientBatchPaymentStatus.Failed;
    case 'not-sent-0-dollars':
      return ClientBatchPaymentStatus.NotSent;
    case 'in-calculation':
      return ClientBatchPaymentStatus.InProgress;
    default:
      return ClientBatchPaymentStatus.Pending;
  }
}

export const buildEntity = (
  clientBatchPayment: any,
): ClientBatchPaymentEntity => {
  const entity = new ClientBatchPaymentEntity();
  entity.id = clientBatchPayment.id;
  entity.createdAt = clientBatchPayment.created_at;
  entity.updatedAt = clientBatchPayment.updated_at;
  entity.expectedPaymentDate = clientBatchPayment.expected_payment_date;
  entity.name = clientBatchPayment.transfer_time;
  entity.type = mapType(clientBatchPayment);
  entity.status = mapStatus(clientBatchPayment);
  return entity;
};
