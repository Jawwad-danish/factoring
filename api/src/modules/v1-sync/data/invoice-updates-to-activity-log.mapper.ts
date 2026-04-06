import {
  BrokerPaymentStatus,
  InvoiceEntity,
  InvoiceStatus,
  TagDefinitionKey,
} from '@module-persistence';

type V1UpdateType = 'paid' | 'approved' | 'declined' | 'pending' | 'note';

const invoiceActivityToV1Mappings: Partial<Record<TagDefinitionKey, string>> = {
  MISSING_BILL_OF_LADING: 'missing bol',
  MISSING_RATE_CONFIRMATION: 'missing rate con',
  MISSING_RECEIVER_SIGNATURE: 'missing signature',
  RATE_CONFIRMATION_BILL_OF_LADING_MISMATCH: 'rate con/bol mismatch',
  INCORRECT_RATE_ADDED: 'rate incorrect',
  UNREADABLE_DOCUMENT: 'unreadable',
  MULTIPLE_RATE_CONFIRMATION_DOCUMENTS: 'multiple rate con',
  MISSING_LUMPER_RECEIPT: 'missing lumper receipt',
  SCANNED_COPY_OF_BILL_OF_LADING_REQUIRED: 'require scanned bol',
  INCORRECT_BROKER_ON_RATE_CONFIRMATION: 'incorrect broker rate con',
  INCORRECT_CLIENT_ON_RATE_CONFIRMATION: 'incorrect client rate con',
  NO_PAPERWORK_UPLOADED: 'no paperwork uploaded',
  CLIENT_NEEDS_TO_CONTACT_BROKER: 'client needs to contact broker',
  MISSING_DOCUMENT: 'missing documents',
  MISSING_SCALE_TICKET: 'missing scale ticket',
  BROKER_CANCELLED_LOAD: 'broker cancelled load',
  UNREPORTED_FUEL_ADVANCE: 'unreported fuel advance',
  OTHER_INVOICE_ISSUE: 'other',
  CLIENT_STATUS_ISSUE: 'client issue',
  BROKER_NOT_FOUND: 'debtor not found',
  WAITING_FOR_BROKER_VERIFICATION: 'waiting on verification',
  CLIENT_HAS_NEGATIVE_RESERVES: 'client balance',
  ADVANCE_TAKEN: 'advance taken',
  TRANSFER_FAILED: 'bobtail transfer failed',
  BROKER_UNRESPONSIVE: 'broker unresponsive',
  FILED_ON_BROKER_BOND: 'filed on bond',
  BROKER_PAID_TO_DIFFERENT_INVOICE: 'broker paid to different invoice',
  BROKER_SENT_PAYMENT_VIA_E_CHECK: 'payment sent via echeck',
  BROKER_PAYMENT_SCHEDULED: 'payment',
  OVER_90_DAYS: 'over 90 days',
  FRAUDULENT_DOCUMENTS: 'fraudulent documents',
  UPLOAD_INVOICE_TO_PORTAL: 'upload to portal',
  MAIL_INVOICE_COPY: 'mail invoice copy',
  MAIL_INVOICE_ORIGINAL: 'originals required',
  POD_AND_RATE_CON_NOT_MATCHING: 'pod and rate con do not match',
  REQUESTED_PAPERWORK_NOT_SUBMITTED: 'requested paperwork not submitted',
  LOAD_NOT_DELIVERED: 'load not delivered',
  BROKER_PAID_PREVIOUS_FACTOR: 'broker paid previous factor',
  BROKER_PAID_CLIENT_DIRECTLY: 'paid to client',
  BROKER_CLAIM_AGAINST_CLIENT: 'debtor claim',
  POSSIBLE_CLAIM_ON_LOAD: 'possible claim on load',
  DOUBLED_BROKERED_LOAD: 'double brokered load',
  CLIENT_LIMIT_EXCEEDED: 'client limit exceeded',
  BROKER_LIMIT_EXCEEDED: 'broker limit exceeded',
  VERIFICATION_ENGINE: 'broker verification required',
  LOW_BROKER_CREDIT_RATING: 'declined low credit rating',
  DUPLICATE_INVOICE: 'duplicate invoice',
  INVOICE_EMAIL_BLOCKED: 'email blocked',
  NOTE: 'note',
  BROKER_INFORMATION_MISSING: 'no delivery options',
  POSSIBLE_DUPLICATE_INVOICE: 'possible duplicate',
  PROCESSING: 'processing',
  VERIFICATION_UNSUCCESSFUL: 'verification unsuccessful',
};

const invoiceActivityToV1OtherMappings: Partial<Record<V1UpdateType, string>> =
  {
    paid: 'paid other',
    approved: 'approved other',
    declined: 'declined other',
    pending: 'pending other',
  };

const paidBrokerPaymentStatuses = [
  BrokerPaymentStatus.InFull,
  BrokerPaymentStatus.Overpaid,
  BrokerPaymentStatus.ShortPaid,
];

export const getV1InvoiceUpdateFromActivityLog = (
  v2Tag: TagDefinitionKey,
): string | undefined => {
  return invoiceActivityToV1Mappings[v2Tag];
};

export const getOtherV1InvoiceUpdateFromActivityLog = (
  v1UpdateType: V1UpdateType,
): string | undefined => {
  return invoiceActivityToV1OtherMappings[v1UpdateType];
};

export const getV1UpdateType = (invoice: InvoiceEntity): V1UpdateType => {
  switch (invoice.status) {
    case InvoiceStatus.Purchased:
      if (paidBrokerPaymentStatuses.includes(invoice.brokerPaymentStatus))
        return 'paid';
      return 'approved';
    case InvoiceStatus.Rejected:
      return 'declined';
    case InvoiceStatus.UnderReview:
    default:
      return 'pending';
  }
};
