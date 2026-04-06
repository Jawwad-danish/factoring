import {
  InvoiceDocumentLabel,
  InvoiceDocumentType,
} from '@module-persistence/entities';
import { UUID } from '@core/uuid';
import { randomString } from '../../seeders/common/random';
import { InvoiceDocument } from '@fs-bobtail/factoring/data';
import { buildStubUser } from '@module-common/test';
import { UpdateInvoiceDocumentLabelRequest } from '../data';

export const buildStubInvoiceDocument = (): InvoiceDocument => {
  return new InvoiceDocument({
    id: UUID.get(),
    name: randomString(10),
    type: InvoiceDocumentType.Uploaded,
    internalUrl: `https://${randomString(10)}`,
    externalUrl: `https://${randomString(10)}`,
    createdAt: new Date(),
    createdBy: buildStubUser(),
    label: InvoiceDocumentLabel.Other,
  });
};

export const buildStubInvoiceDocumentUpdateLabelRequest =
  (): UpdateInvoiceDocumentLabelRequest => {
    return new UpdateInvoiceDocumentLabelRequest({
      id: UUID.get(),
      label: InvoiceDocumentLabel.Other,
    });
  };
