import { TagDefinitionKey } from '@module-persistence/entities';
import {
  BrokerPaymentActivityPayload,
  BrokerPaymentNonFactoredActivityPayload,
} from './broker-payment-payload-types';
import {
  ActivityPayload,
  BrokerCancelledLoadPayload as BrokerCancelledLoadActivityPayload,
  BrokerClaimActivityPayload,
  BrokerNotFoundActivityPayload,
  BrokerPaidClientDirectlyActivityPayload,
  BrokerPaidPreviousFactorActivityPayload,
  BrokerPaidToDifferentInvoiceActivityPayload,
  BrokerPaymentScheduledActivityPayload,
  BrokerSentPaymentViaECheckActivityPayload,
  ClientBrokerAssignmentActivityPayload,
  ClientNeedsToContactBrokerActivityPayload,
  ClientOnHoldActivityPayload,
  ClientStatusIssuePayload,
  CreateInvoiceActivityPayload,
  DocumentsActivityPayload,
  DuplicateInvoiceActivityPayload,
  EmailSentActivityPayload,
  FiledOnBrokerBondActivityPayload,
  LowCreditBrokerActivityPayload,
  MissingDocumentActivityPayload,
  NoBrokerDeliveryOptionsActivityPayload,
  PaidToClientPayload as PaidToClientActivityPayload,
  PossibleDuplicateActivityPayload,
  ProcessingActivityPayload,
  RateIncorrectActivityPayload,
  WaitingForBrokerVerificationActivityPayload,
} from './payload-types';

type TagDefinitionPayloads = {
  [TagDefinitionKey.CREATE_INVOICE]: CreateInvoiceActivityPayload;
  [TagDefinitionKey.CLIENT_ON_HOLD]: ClientOnHoldActivityPayload;
  [TagDefinitionKey.CLIENT_STATUS_ISSUE]: ClientStatusIssuePayload;
  [TagDefinitionKey.UPDATE_INVOICE]: ActivityPayload;
  [TagDefinitionKey.REJECT_INVOICE]: ActivityPayload;
  [TagDefinitionKey.REVERT_INVOICE]: ActivityPayload;
  [TagDefinitionKey.PURCHASE_INVOICE]: ActivityPayload;
  [TagDefinitionKey.POSSIBLE_DUPLICATE_INVOICE]: PossibleDuplicateActivityPayload;
  [TagDefinitionKey.BROKER_INFORMATION_MISSING]: NoBrokerDeliveryOptionsActivityPayload;
  [TagDefinitionKey.LOW_BROKER_CREDIT_RATING]: LowCreditBrokerActivityPayload;
  [TagDefinitionKey.BROKER_NOT_FOUND]: BrokerNotFoundActivityPayload;
  [TagDefinitionKey.BROKER_CLAIM_AGAINST_CLIENT]: BrokerClaimActivityPayload;
  [TagDefinitionKey.BROKER_PAID_PREVIOUS_FACTOR]: BrokerPaidPreviousFactorActivityPayload;
  [TagDefinitionKey.BROKER_CANCELLED_LOAD]: BrokerCancelledLoadActivityPayload;
  [TagDefinitionKey.PAID_TO_CLIENT]: PaidToClientActivityPayload;
  [TagDefinitionKey.FILED_ON_BROKER_BOND]: FiledOnBrokerBondActivityPayload;
  [TagDefinitionKey.BROKER_PAYMENT_SHORTPAY]: ActivityPayload;
  [TagDefinitionKey.BROKER_PAYMENT_OVERPAY]: BrokerPaymentActivityPayload;
  [TagDefinitionKey.BROKER_PAYMENT_IN_FULL]: BrokerPaymentActivityPayload;
  [TagDefinitionKey.BROKER_PAYMENT_NON_FACTORED]: BrokerPaymentNonFactoredActivityPayload;
  [TagDefinitionKey.BROKER_PAYMENT_PENDING]: BrokerPaymentActivityPayload;
  [TagDefinitionKey.BROKER_PAYMENT_NON_PAYMENT]: BrokerPaymentActivityPayload;
  [TagDefinitionKey.INCORRECT_RATE_ADDED]: RateIncorrectActivityPayload;
  [TagDefinitionKey.CREATE_CLIENT_BROKER_ASSIGNMENT]: ClientBrokerAssignmentActivityPayload;
  [TagDefinitionKey.UPDATE_CLIENT_BROKER_ASSIGNMENT]: ClientBrokerAssignmentActivityPayload;
  [TagDefinitionKey.DOCUMENTS_ADD]: DocumentsActivityPayload;
  [TagDefinitionKey.DOCUMENTS_DELETE]: DocumentsActivityPayload;
  [TagDefinitionKey.DOCUMENTS_UPDATE]: DocumentsActivityPayload;
  [TagDefinitionKey.VERIFY_INVOICE]: WaitingForBrokerVerificationActivityPayload;
  [TagDefinitionKey.WAITING_FOR_BROKER_VERIFICATION]: WaitingForBrokerVerificationActivityPayload;
  [TagDefinitionKey.MISSING_DOCUMENT]: MissingDocumentActivityPayload;
  [TagDefinitionKey.BROKER_PAYMENT_SCHEDULED]: BrokerPaymentScheduledActivityPayload;
  [TagDefinitionKey.MISSING_RATE_CONFIRMATION]: ActivityPayload;
  [TagDefinitionKey.CLIENT_HAS_NEGATIVE_RESERVES]: ActivityPayload;
  [TagDefinitionKey.MAIL_INVOICE_ORIGINAL]: ActivityPayload;
  [TagDefinitionKey.RATE_CONFIRMATION_BILL_OF_LADING_MISMATCH]: ActivityPayload;
  [TagDefinitionKey.UNREADABLE_DOCUMENT]: ActivityPayload;
  [TagDefinitionKey.OTHER_INVOICE_ISSUE]: ActivityPayload;
  [TagDefinitionKey.BROKER_PAID_CLIENT_DIRECTLY]: BrokerPaidClientDirectlyActivityPayload;
  [TagDefinitionKey.BROKER_UNRESPONSIVE]: ActivityPayload;
  [TagDefinitionKey.MISSING_RECEIVER_SIGNATURE]: ActivityPayload;
  [TagDefinitionKey.REQUESTED_PAPERWORK_NOT_SUBMITTED]: ActivityPayload;
  [TagDefinitionKey.BROKER_PAID_TO_DIFFERENT_INVOICE]: BrokerPaidToDifferentInvoiceActivityPayload;
  [TagDefinitionKey.MAIL_INVOICE_COPY]: ActivityPayload;
  [TagDefinitionKey.MISSING_LUMPER_RECEIPT]: ActivityPayload;
  [TagDefinitionKey.DUPLICATE_INVOICE]: DuplicateInvoiceActivityPayload;
  [TagDefinitionKey.CLIENT_NEEDS_TO_CONTACT_BROKER]: ClientNeedsToContactBrokerActivityPayload;
  [TagDefinitionKey.ADVANCE_TAKEN]: ActivityPayload;
  [TagDefinitionKey.BROKER_SENT_PAYMENT_VIA_E_CHECK]: BrokerSentPaymentViaECheckActivityPayload;
  [TagDefinitionKey.EMAIL_SEND_FAILED]: ActivityPayload;
  [TagDefinitionKey.INCORRECT_CLIENT_ON_RATE_CONFIRMATION]: ActivityPayload;
  [TagDefinitionKey.VERIFICATION_UNSUCCESSFUL]: ActivityPayload;
  [TagDefinitionKey.LOAD_NOT_DELIVERED]: ActivityPayload;
  [TagDefinitionKey.MISSING_SCALE_TICKET]: ActivityPayload;
  [TagDefinitionKey.SCANNED_COPY_OF_BILL_OF_LADING_REQUIRED]: ActivityPayload;
  [TagDefinitionKey.POSSIBLE_CLAIM_ON_LOAD]: ActivityPayload;
  [TagDefinitionKey.UPLOAD_INVOICE_TO_PORTAL]: ActivityPayload;
  [TagDefinitionKey.EMAIL_SENT]: EmailSentActivityPayload;
  [TagDefinitionKey.PROCESSING]: ProcessingActivityPayload;
};

export class ActivityLogPayloadBuilder {
  static forKey<K extends keyof TagDefinitionPayloads>(
    _key: K,
    payload: TagDefinitionPayloads[K],
  ): TagDefinitionPayloads[K] {
    return { ...payload };
  }
}
