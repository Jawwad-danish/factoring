import Big from 'big.js';
import { randomInt } from 'crypto';
import { UUID } from '@core/uuid';
import {
  randomLoadNumber,
  randomMemo,
  randomNote,
} from '../../seeders/common/random';
import { UpdateInvoiceRequest } from '../data';
import {
  buildStubInvoiceDocument as buildStubInvoiceDocument,
  buildStubInvoiceDocumentUpdateLabelRequest,
} from './invoice-document.model.stub';
import { instanceToPlain } from 'class-transformer';

export const buildStubUpdateInvoiceRequest = (
  data?: Partial<UpdateInvoiceRequest>,
): UpdateInvoiceRequest => {
  const request = new UpdateInvoiceRequest({
    clientId: data?.clientId ?? UUID.get(),
    brokerId: data?.brokerId ?? UUID.get(),
    loadNumber: data?.loadNumber ?? randomLoadNumber(),
    note: 'note',
    memo: 'memo',
    lineHaulRate: new Big(100),
    detention: new Big(100),
    lumper: new Big(100),
    advance: new Big(100),
    expedited: data?.expedited ?? true,
  });
  Object.assign(request, data);
  return request;
};

export const buildStubUpdateInvoiceAmounts = (): UpdateInvoiceRequest => {
  return new UpdateInvoiceRequest({
    lineHaulRate: new Big(randomInt(1000)),
    lumper: new Big(randomInt(1000)),
    detention: new Big(randomInt(1000)),
    advance: new Big(randomInt(1000)),
  });
};

export const buildStubUpdateInvoiceDetails = (): UpdateInvoiceRequest => {
  return new UpdateInvoiceRequest({
    clientId: UUID.get(),
    brokerId: UUID.get(),
    loadNumber: randomLoadNumber(),
    note: randomNote(),
    memo: randomMemo(),
  });
};

export const buildStubUpdateInvoiceDocumentsAdd = (): UpdateInvoiceRequest => {
  return new UpdateInvoiceRequest({
    documents: {
      toAdd: [buildStubInvoiceDocument()],
      toDelete: [],
      toUpdate: [],
    },
  });
};

export const buildStubUpdateInvoiceDocumentsLabel =
  (): UpdateInvoiceRequest => {
    return new UpdateInvoiceRequest({
      documents: {
        toAdd: [],
        toDelete: [],
        toUpdate: [buildStubInvoiceDocumentUpdateLabelRequest()],
      },
    });
  };

export class UpdateInvoiceRequestBuilder {
  private request: UpdateInvoiceRequest;

  constructor(data?: Partial<UpdateInvoiceRequest>) {
    this.request = new UpdateInvoiceRequest(data);
  }

  getPayload() {
    const result = instanceToPlain(this.request, {
      exposeUnsetFields: false,
    });
    return result;
  }
}
