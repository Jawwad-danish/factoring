import {
  ActivityLogEntity,
  BrokerPaymentEntity,
  BrokerPaymentStatus,
  InvoiceDocumentEntity,
  InvoiceEntity,
  RecordStatus,
  TagDefinitionEntity,
  TagDefinitionKey,
} from '../entities';
import { BrokerPaymentEntityUtil } from './broker-payment-entity-util';

export class InvoiceEntityUtil {
  static async hasActiveBrokerPayments(
    invoice: InvoiceEntity,
  ): Promise<boolean> {
    return (await this.getActiveBrokerPayments(invoice)).length > 0;
  }

  static async getActiveBrokerPayments(
    invoice: InvoiceEntity,
  ): Promise<BrokerPaymentEntity[]> {
    await invoice.brokerPayments.loadItems();
    return invoice.brokerPayments.filter(
      (e) => e.recordStatus === RecordStatus.Active,
    );
  }

  static async calculateBrokerPaymentStatus(
    invoice: InvoiceEntity,
    additionalBrokerPayment?: BrokerPaymentEntity,
  ): Promise<BrokerPaymentStatus> {
    const activeBrokerPayments = await this.getActiveBrokerPayments(invoice);
    if (additionalBrokerPayment) {
      const found = activeBrokerPayments.find(
        (item) => item.id === additionalBrokerPayment.id,
      );
      if (
        !found &&
        additionalBrokerPayment.recordStatus === RecordStatus.Active
      ) {
        activeBrokerPayments.push(additionalBrokerPayment);
      }
    }

    if (activeBrokerPayments.length === 0) {
      return BrokerPaymentStatus.NotReceived;
    }

    const { accountsReceivableValue } = invoice;
    const totalBrokerPaymentsAmount =
      BrokerPaymentEntityUtil.total(activeBrokerPayments);

    if (totalBrokerPaymentsAmount.eq(0)) {
      return BrokerPaymentStatus.NonPayment;
    }
    if (accountsReceivableValue.gt(totalBrokerPaymentsAmount)) {
      return BrokerPaymentStatus.ShortPaid;
    }
    if (accountsReceivableValue.lt(totalBrokerPaymentsAmount)) {
      return BrokerPaymentStatus.Overpaid;
    }
    if (accountsReceivableValue.eq(totalBrokerPaymentsAmount)) {
      return BrokerPaymentStatus.InFull;
    }
    return BrokerPaymentStatus.NotReceived;
  }

  static async findActiveTag(
    invoice: InvoiceEntity,
    key: TagDefinitionKey,
  ): Promise<null | TagDefinitionEntity> {
    if (invoice.tags && !invoice.tags.isInitialized()) {
      await invoice.tags.loadItems();
    }
    const found = invoice.tags.find(
      (tag) =>
        tag.tagDefinition.key === key &&
        tag.recordStatus == RecordStatus.Active,
    );
    return found?.tagDefinition || null;
  }

  static async findActivityLogByActivityId(
    invoice: InvoiceEntity,
    activityId: string,
  ): Promise<null | ActivityLogEntity> {
    if (invoice.activities && !invoice.activities.isInitialized()) {
      await invoice.activities.loadItems();
    }
    const found = invoice.activities.find(
      (activity) =>
        activity.id === activityId &&
        activity.recordStatus == RecordStatus.Active,
    );
    return found || null;
  }

  static async findActivityLogByTagDefinitionKey(
    invoice: InvoiceEntity,
    tagDefinitionKey: TagDefinitionKey,
  ): Promise<null | ActivityLogEntity> {
    if (invoice.activities && !invoice.activities.isInitialized()) {
      await invoice.activities.loadItems();
    }
    const found = invoice.activities.find(
      (activity) =>
        activity.tagDefinition.key === tagDefinitionKey &&
        activity.recordStatus == RecordStatus.Active,
    );
    return found || null;
  }

  static async isTagged(
    invoice: InvoiceEntity,
    key: TagDefinitionKey,
  ): Promise<boolean> {
    return (await InvoiceEntityUtil.findActiveTag(invoice, key)) != null;
  }

  static async findActiveDocumentById(
    invoice: InvoiceEntity,
    documentId: string,
  ): Promise<null | InvoiceDocumentEntity> {
    await invoice.documents.loadItems();
    const found = invoice.documents.find(
      (document) =>
        document.id === documentId &&
        document.recordStatus === RecordStatus.Active,
    );
    return found ?? null;
  }
}
