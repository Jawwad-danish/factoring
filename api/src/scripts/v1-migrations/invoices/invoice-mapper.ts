import { EntityManager } from '@mikro-orm/core';
import {
  BrokerPaymentStatus,
  ClientPaymentStatus,
  InvoiceEntity,
  InvoiceStatus,
  TagDefinitionEntity,
  VerificationStatus,
} from '@module-persistence/entities';
import Big from 'big.js';
import { percentageOfNumber } from '../../../core/formulas';
import { mapInvoiceTags } from './invoice-tags-mapper';

const mapVerificationStatus = (invoice: any): VerificationStatus => {
  const status = invoice.verified as string;
  const requiresVerification = invoice.requires_verification as boolean;
  const bypassedVerification = invoice.skipped_verification as boolean;

  if (bypassedVerification) {
    return VerificationStatus.Bypassed;
  }

  switch (status) {
    case 'pending':
      const found = invoice.invoice_updates.filter(
        (invoiceUpdate) =>
          invoiceUpdate.update_status === 'waiting on verification' &&
          invoiceUpdate.update_type === 'pending',
      );
      if (found) {
        return VerificationStatus.InProgress;
      }
      return requiresVerification
        ? VerificationStatus.Required
        : VerificationStatus.NotRequired;
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

export const mapStatusClientPayment = (invoice: any): ClientPaymentStatus => {
  const statusClientPayment = invoice.status_client_payment;
  const isBuyout = invoice.is_buyout as boolean;
  const status = invoice.status as string;
  if (isBuyout && (status === 'paid' || status === 'approved')) {
    return ClientPaymentStatus.Sent;
  }
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

export const buildIncompleteEntity = (invoice: any): InvoiceEntity => {
  const entity = new InvoiceEntity();
  entity.id = invoice.id;
  entity.clientId = invoice.client_id;
  entity.brokerId = invoice.debtor_id;
  entity.loadNumber = invoice.load_number;
  entity.status = mapStatus(invoice);
  entity.advance = new Big(invoice.advance);
  entity.lineHaulRate = new Big(invoice.primary_rate);
  entity.detention = new Big(invoice.detention);
  entity.lumper = new Big(invoice.lumper);
  entity.deduction = new Big(invoice.approved_invoice_adjustment_amount);
  entity.expedited = mapTransferType(invoice);
  entity.value = new Big(invoice.total_amount);
  entity.approvedFactorFee = new Big(invoice.approved_factor_fee);
  entity.reserveFee = new Big(invoice.reserve_fee);
  entity.reserveRatePercentage =
    invoice.total_amount === 0
      ? new Big(0)
      : percentageOfNumber(entity.reserveFee, entity.value);
  entity.accountsReceivableValue = new Big(
    invoice.approved_accounts_receivable_amount,
  );
  entity.approvedFactorFeePercentage =
    invoice.total_amount === 0
      ? new Big(0)
      : percentageOfNumber(entity.approvedFactorFee, entity.value);
  entity.clientPaymentStatus = mapStatusClientPayment(invoice);
  entity.brokerPaymentStatus = mapStatusBrokerPayment(invoice);
  entity.note = invoice.note;
  entity.memo = invoice.memo;
  entity.createdAt = new Date(invoice.created_at);
  entity.updatedAt = new Date(invoice.updated_at);
  entity.displayId = String(invoice.display_id);
  entity.paymentDate = invoice.paid_date ? new Date(invoice.paid_date) : null;
  entity.purchasedDate = invoice.approved_date
    ? new Date(invoice.approved_date)
    : null;
  entity.rejectedDate = invoice.declined_date
    ? new Date(invoice.declined_date)
    : null;
  entity.verificationStatus = mapVerificationStatus(invoice);
  if (invoice.is_buyout === true) {
    entity['is_buyout'] = true;
  }

  return entity;
};

export const buildCompleteInvoiceEntity = (
  invoice: any,
  tagDefinitions: TagDefinitionEntity[],
  em: EntityManager,
): InvoiceEntity => {
  const entity = buildIncompleteEntity(invoice);
  entity.tags.hydrate(mapInvoiceTags(invoice, tagDefinitions, em));
  return entity;
};
