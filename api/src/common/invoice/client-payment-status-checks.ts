import { ClientPaymentStatus } from '@module-persistence';

const invoiceEditableClientPaymentStatuses = [
  ClientPaymentStatus.Sent,
  ClientPaymentStatus.Completed,
  ClientPaymentStatus.InProgress,
];
export const isValidClientPaymentStatusForEditing = (
  clientPaymentStatus: ClientPaymentStatus,
): boolean => {
  return invoiceEditableClientPaymentStatuses.includes(clientPaymentStatus);
};
