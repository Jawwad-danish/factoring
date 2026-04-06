import {
  InvoiceDocumentEntity,
  InvoiceDocumentType,
} from '@module-persistence/entities';
import { INVOICE } from '../mocks';
import { EntityStubs } from '@module-persistence/test';
import { InvoiceDocument } from '@fs-bobtail/factoring/data';

const baseInvoiceDocument = {
  documentName: 'Invoice1.pdf',
  documentType: InvoiceDocumentType.Generated,
  documentUrl: 'mocked-url',
  invoice: INVOICE,
};

export const INVOICE_DOCUMENT_ENTITY: InvoiceDocumentEntity = (() => {
  const entity = new InvoiceDocumentEntity();
  const userEntity = EntityStubs.buildStubUser();
  Object.assign(entity, {
    ...baseInvoiceDocument,
    createdBy: userEntity,
    updatedBy: userEntity,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return entity;
})();

export const INVOICE_DOCUMENT_MODEL = (() => {
  const model = new InvoiceDocument();
  const userModel = EntityStubs.buildStubUser();
  Object.assign(model, {
    ...baseInvoiceDocument,
    createdBy: userModel,
    updatedBy: userModel,
    createdAt: new Date(),
    updatedAt: new Date(),
    options: {
      sendDocumentAfterProcessingFlag: false,
    },
  });
  return model;
})();
