import { EntityManager } from '@mikro-orm/core';
import {
  InvoiceDocumentEntity,
  InvoiceDocumentLabel,
  InvoiceDocumentType,
} from '@module-persistence/entities';
import { referenceUserData } from 'src/scripts/util';

const getDocumentType = (document: any): InvoiceDocumentType => {
  if (
    document.document_type === 'combined' ||
    document.name === 'Bobtail Invoice.pdf'
  ) {
    return InvoiceDocumentType.Generated;
  }
  return InvoiceDocumentType.Uploaded;
};

const getDocumentLabel = (document: any): InvoiceDocumentLabel => {
  if (document.metadata.label) {
    switch (document.metadata.label) {
      case 'BOL':
      case 'Bill Of Lading':
        return InvoiceDocumentLabel.Bill_of_landing;
      case 'Lumper Receipt':
        return InvoiceDocumentLabel.Lumper_receipt;
      case 'Rate Confirmation':
        return InvoiceDocumentLabel.Rate_of_confirmation;
      case 'Scale Ticket':
        return InvoiceDocumentLabel.Scale_ticket;
    }
  }
  return InvoiceDocumentLabel.Other;
};

const mapInvoiceDocument = (document: any): InvoiceDocumentEntity => {
  const entity = new InvoiceDocumentEntity();
  entity.id = document.id;
  entity.name = document.name;
  entity.internalUrl = document.url;
  entity.type = getDocumentType(document);
  entity.label = getDocumentLabel(document);
  entity.externalUrl = document.filestack_url;
  entity.thumbnailUrl = document.metadata.thumbnailUrl;
  entity.createdAt = document.created_at;
  entity.updatedAt = document.updated_at;
  return entity;
};

export const mapInvoiceDocuments = (
  invoice: any,
  em: EntityManager,
): InvoiceDocumentEntity[] => {
  return (invoice.invoice_documents || []).map((document: any) => {
    const entity = mapInvoiceDocument(document);
    referenceUserData(entity, document, em);
    return entity;
  });
};
