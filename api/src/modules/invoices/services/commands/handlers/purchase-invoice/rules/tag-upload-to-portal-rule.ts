import { ChangeActions } from '@common';
import { BrokerEmailType } from '@module-brokers';
import {
  CommandInvoiceContext,
  PurchaseInvoiceRequest,
} from '@module-invoices/data';
import { RecordStatus, TagDefinitionKey } from '@module-persistence/entities';
import { PurchaseInvoiceRule } from './purchase-invoice-rule';

export class TagUploadToPortalRule implements PurchaseInvoiceRule {
  async run(
    context: CommandInvoiceContext<PurchaseInvoiceRequest>,
  ): Promise<ChangeActions> {
    const { broker } = context;
    if (broker === null) {
      return ChangeActions.empty();
    }

    const brokerInvoiceEmails = broker.emails.filter(
      (email) =>
        email.type === BrokerEmailType.InvoiceDelivery &&
        email.recordStatus === RecordStatus.Active,
    );

    if (brokerInvoiceEmails.length === 0 && broker.portalUrl) {
      return ChangeActions.addTag(TagDefinitionKey.UPLOAD_INVOICE_TO_PORTAL);
    }

    return ChangeActions.empty();
  }
}
