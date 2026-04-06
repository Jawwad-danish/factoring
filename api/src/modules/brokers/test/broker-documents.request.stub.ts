import {
  BrokerDocument,
  BrokerDocumentRequest,
  BrokerDocumentType,
} from '@module-brokers/data';
import { buildStubUser } from '@module-common/test';
import { BrokerDocumentResponse } from '../api/data';

export class BrokerDocumentsStubs {
  static buildStubBrokerDocumentsRequest(
    data?: Partial<BrokerDocumentRequest>,
  ) {
    const request = new BrokerDocumentRequest({
      internalUrl: 'http://localhost:3000',
      externalUrl: 'http://localhost:3000',
      type: BrokerDocumentType.RATE_CONFIRMATION,
      createdBy: '123',
      updatedBy: '1234',
    });
    Object.assign(request, data);
    return request;
  }

  static buildStubBrokerDocument(data?: Partial<BrokerDocument>) {
    const document = new BrokerDocument({
      internalUrl: 'http://localhost:3000',
      externalUrl: 'http://localhost:3000',
      type: BrokerDocumentType.RATE_CONFIRMATION,
      createdBy: buildStubUser(),
      updatedBy: buildStubUser(),
    });
    Object.assign(document, data);
    return document;
  }

  static buildStubBrokerDocumentResponse = (
    data?: Partial<BrokerDocumentResponse>,
  ) => {
    const document = new BrokerDocumentResponse({
      internalUrl: 'http://localhost:3000',
      externalUrl: 'http://localhost:3000',
      type: BrokerDocumentType.RATE_CONFIRMATION,
      createdBy: '123',
      updatedBy: '1234',
    });
    Object.assign(document, data);
    return document;
  };
}
