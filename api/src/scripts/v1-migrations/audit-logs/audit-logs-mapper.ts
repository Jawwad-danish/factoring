import { businessMonthDayYear, formatToDollars } from '@core/formatting';
import { EntityManager } from '@mikro-orm/core';
import {
  AuditLogEntity,
  AuditLogType,
  BrokerPaymentType,
  RecordStatus,
  UserEntity,
} from '@module-persistence/entities';
import { penniesToDollars } from '@core/formulas';

export const buildBrokerPaymentAuditLogEntity = (
  auditLog: any,
  em: EntityManager,
): AuditLogEntity => {
  const type =
    auditLog.transaction_type === 'ach'
      ? BrokerPaymentType.Ach
      : BrokerPaymentType.Check;
  const entity = new AuditLogEntity();
  entity.id = auditLog.id;
  entity.recordStatus = RecordStatus.Active;
  entity.type = AuditLogType.BrokerPayment;
  entity.notes = [];
  entity.payload = {};
  entity.createdBy = em.getReference(UserEntity, auditLog.updated_by);
  entity.createdAt = auditLog.updated_at;
  if (auditLog.is_created) {
    const notes = [
      `${auditLog?.client_name || ''}.`,
      `Added amount: ${formatToDollars(penniesToDollars(auditLog.amount))}.`,
      `Added batch date: ${businessMonthDayYear(auditLog.batch_date)}.`,
      `Added type: ${type}.`,
    ];
    if (auditLog.check_number) {
      notes.push(`Added check number: ${auditLog.check_number}.`);
    }
    entity.notes = notes;
    entity.payload = {
      operation: 'create',
      invoiceId: auditLog.invoice_id,
      invoiceNumber: auditLog.invoice_display_id,
      invoiceCreationDate: auditLog.invoice_created_at,
      brokerPaymentId: auditLog.original_id,
      brokerPaymentAmount: auditLog.amount,
      brokerPaymentCreationDate: auditLog.original_created_at,
      brokerPaymentBatchDate: auditLog.batch_date,
      brokerPaymentCheckNumber: auditLog.check_number,
      brokerPaymentType: type,
    };
  }
  if (auditLog.is_deleted) {
    const notes = [
      `${auditLog?.client_name || ''}.`,
      `Deleted amount: ${formatToDollars(penniesToDollars(auditLog.amount))}.`,
    ];
    entity.notes = notes;
    entity.payload = {
      operation: 'delete',
      invoiceId: auditLog.invoice_id,
      invoiceNumber: auditLog.invoice_display_id,
      invoiceCreationDate: auditLog.invoice_created_at,
      brokerPaymentId: auditLog.original_id,
      brokerPaymentAmount: auditLog.amount,
      brokerPaymentCreationDate: auditLog.original_created_at,
      brokerPaymentBatchDate: auditLog.batch_date,
      brokerPaymentCheckNumber: auditLog.check_number,
      brokerPaymentType: type,
    };
  }
  if (!auditLog.is_deleted && !auditLog.is_created) {
    const notes = [
      `${auditLog?.client_name || ''}.`,
      `Changed transaction type from ${type}.`,
      `Changed batch date from ${businessMonthDayYear(auditLog.batch_date)}`,
      `Changed check number from ${auditLog.check_number}`,
    ];
    entity.notes = notes;
    auditLog.payload = {
      operation: 'edit',
      invoiceId: auditLog.invoice_id,
      invoiceNumber: auditLog.invoice_display_id,
      invoiceCreationDate: auditLog.invoice_created_at,
      brokerPaymentId: auditLog.original_id,
      brokerPaymentAmount: auditLog.amount,
      brokerPaymentCreationDate: auditLog.original_created_at,
      previousBrokerPaymentBatchDate: auditLog.batch_date,
      previousBrokerPaymentCheckNumber: auditLog.check_number,
      previousBrokerPaymentType: type,
    };
  }

  return entity;
};
