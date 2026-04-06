import { percentageOfNumber } from '@core/formulas';
import {
  BrokerPaymentStatus,
  ClientPaymentStatus,
  InvoiceStatus,
  RecordStatus,
  VerificationStatus,
} from '@module-persistence/entities';
import {
  InvoiceHistoryEntity,
  OperationType,
} from '@module-persistence/history';
import Big from 'big.js';

const mapVerificationStatus = (invoice: any): VerificationStatus => {
  const status = invoice.verified as string;
  const requiresVerification = invoice.requires_verification as boolean;
  const bypassedVerification = invoice.skipped_verification as boolean;

  if (bypassedVerification) {
    return VerificationStatus.Bypassed;
  }

  switch (status) {
    case 'pending':
      return VerificationStatus.InProgress;
    case 'verified':
      return VerificationStatus.Verified;
    case 'declined':
      return VerificationStatus.Failed;
    default:
      return requiresVerification
        ? VerificationStatus.Required
        : VerificationStatus.NotRequired;
  }
};

export const mapStatus = (invoice: any): InvoiceStatus => {
  const status = invoice.status as string;
  switch (status) {
    case 'approved':
    case 'paid':
      return InvoiceStatus.Purchased;
    case 'declined':
      return InvoiceStatus.Rejected;
    case 'pending':
    default:
      return InvoiceStatus.UnderReview;
  }
};

const mapTransferType = (invoice: any): boolean => {
  const transferType = invoice.transfer_type;
  switch (transferType) {
    case 'wire':
      return true;
    case 'ach':
    default:
      return false;
  }
};

const mapStatusClientPayment = (invoice: any): ClientPaymentStatus => {
  const statusClientPayment = invoice.status_client_payment;
  switch (statusClientPayment) {
    case 'confirmed':
      return ClientPaymentStatus.Completed;
    case 'processing':
      return ClientPaymentStatus.Sent;
    case 'not_paid':
    default:
      if (invoice.status === 'approved') {
        return ClientPaymentStatus.Pending;
      }
      return ClientPaymentStatus.NotApplicable;
  }
};

const mapStatusBrokerPayment = (invoice: any): BrokerPaymentStatus => {
  const statusBrokerPayment = invoice.status_debtor_payment;
  switch (statusBrokerPayment) {
    case 'shortpay':
      return BrokerPaymentStatus.ShortPaid;
    case 'overpay':
      return BrokerPaymentStatus.Overpaid;
    case 'nonpayment':
      return BrokerPaymentStatus.NonPayment;
    case 'fully_paid':
      return BrokerPaymentStatus.InFull;
    case 'pending_payment':
    default:
      return BrokerPaymentStatus.NotReceived;
  }
};
export const buildEntity = (history: any): InvoiceHistoryEntity => {
  const entity = new InvoiceHistoryEntity();
  entity.entityId = history.original_id;
  entity.entityCreatedAt = new Date(history.original_created_at);
  entity.entityRecordStatus = history.is_deleted
    ? RecordStatus.Inactive
    : RecordStatus.Active;
  entity.operationType = history.is_deleted
    ? OperationType.Delete
    : history.is_created
    ? OperationType.Create
    : OperationType.Update;
  entity.id = history.id;
  entity.clientId = history.client_id;
  entity.brokerId = history.debtor_id;
  entity.loadNumber = history.load_number;
  entity.status = mapStatus(history);
  entity.advance = new Big(history.advance);
  entity.lineHaulRate = new Big(history.primary_rate);
  entity.detention = new Big(history.detention);
  entity.lumper = new Big(history.lumper);
  entity.deduction = new Big(history.approved_invoice_adjustment_amount);
  entity.expedited = mapTransferType(history);
  entity.value = new Big(history.total_amount);
  entity.approvedFactorFee = new Big(history.approved_factor_fee);
  entity.reserveFee = new Big(history.reserve_fee);
  entity.reserveRatePercentage =
    history.total_amount === 0
      ? new Big(0)
      : percentageOfNumber(entity.reserveFee, entity.value);
  entity.accountsReceivableValue = new Big(
    history.approved_accounts_receivable_amount,
  );
  entity.approvedFactorFeePercentage =
    history.total_amount === 0
      ? new Big(0)
      : percentageOfNumber(entity.approvedFactorFee, entity.value);
  entity.clientPaymentStatus = mapStatusClientPayment(history);
  entity.brokerPaymentStatus = mapStatusBrokerPayment(history);
  entity.note = history.note;
  entity.memo = history.memo;
  entity.createdAt = new Date(history.created_at);
  entity.displayId = String(history.display_id);
  entity.paymentDate = history.paid_date ? new Date(history.paid_date) : null;
  entity.purchasedDate = history.approved_date
    ? new Date(history.approved_date)
    : null;
  entity.rejectedDate = history.declined_date
    ? new Date(history.declined_date)
    : null;
  entity.verificationStatus = mapVerificationStatus(history);
  entity.createdById = history.updated_by;
  return entity;
};
