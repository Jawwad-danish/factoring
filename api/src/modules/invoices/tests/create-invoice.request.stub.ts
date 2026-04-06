import { RequestBuilderMixin } from '@core/test';
import { UUID } from '@core/uuid';
import {
  CreateInvoiceDocumentsRequest,
  CreateInvoiceRequest,
} from '@fs-bobtail/factoring/data';
import Big from 'big.js';
import { randomInt } from 'crypto';
import { randomDisplayId, randomLoadNumber } from '../../seeders/common/random';

export const buildStubCreateInvoiceRequest = (
  data?: Partial<CreateInvoiceRequest>,
): CreateInvoiceRequest => {
  const request = new CreateInvoiceRequest({
    clientId: UUID.get(),
    displayId: randomDisplayId(),
    documents: [],
    loadNumber: randomLoadNumber(),
    note: 'note',
    memo: 'memo',
    lineHaulRate: new Big(30000),
    detention: new Big(0),
    lumper: new Big(0),
    advance: new Big(0),
    approvedFactorFee: new Big(0),
    expedited: false,
  });
  // We need to set the broker ID separetly because the
  // request object has a default value of null and it will
  // overwrite our value
  request.brokerId = UUID.get();
  Object.assign(request, data);
  return request;
};

export class CreateInvoiceRequestBuilder extends RequestBuilderMixin<CreateInvoiceRequest>(
  () => {
    return buildStubCreateInvoiceRequest();
  },
) {
  withDocuments() {
    return CreateInvoiceRequestBuilder.from({
      documents: [
        new CreateInvoiceDocumentsRequest({
          name: 'cat',
          internalUrl:
            'https://dev-bobtail-integration-testing-stubs.s3.amazonaws.com/cat.jpeg',
          externalUrl:
            'https://dev-bobtail-integration-testing-stubs.s3.amazonaws.com/cat.jpeg',
        }),
        new CreateInvoiceDocumentsRequest({
          name: 'dog',
          internalUrl:
            'https://dev-bobtail-integration-testing-stubs.s3.amazonaws.com/dog.jpeg',
          externalUrl:
            'https://dev-bobtail-integration-testing-stubs.s3.amazonaws.com/dog.jpeg',
        }),
      ],
    });
  }

  withRandomMonetary() {
    return CreateInvoiceRequestBuilder.from({
      lineHaulRate: new Big(randomInt(50, 100)),
      detention: new Big(randomInt(1, 10)),
      lumper: new Big(randomInt(1, 10)),
      advance: new Big(randomInt(1, 10)),
    });
  }
}
