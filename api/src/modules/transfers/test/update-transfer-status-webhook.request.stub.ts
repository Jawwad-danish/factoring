import { RequestBuilder } from '@core/test';
import { DeepPartial } from '@core/types';
import { UUID } from '@core/uuid';
import Big from 'big.js';
import _ from 'lodash';
import {
  BatchState,
  PaymentTransfer,
  TransferData,
  TransferDirection,
  TransferPaymentType,
  TransferState,
  UpdateTransferStatusWebhookRequest,
} from '../data/update-transfer-status-webhook.request';

export const buildStubUpdateTransferStatusWebhookRequest = (
  transferType: TransferPaymentType,
  data?: DeepPartial<UpdateTransferStatusWebhookRequest>,
): UpdateTransferStatusWebhookRequest => {
  const payload = new UpdateTransferStatusWebhookRequest();
  payload.type = 'BatchTransfer.completed';
  payload.id = UUID.get();
  payload.timestamp = new Date().toISOString();

  payload.data = new TransferData({
    id: UUID.get(),
    amount: new Big(1000),
    externalId: UUID.get(),
    metadata: {},
    state: data?.data?.state || BatchState.Completed,
    transfers: [
      new PaymentTransfer({
        id: UUID.get(),
        state: TransferState.Completed,
        amount: new Big(1000),
        direction: TransferDirection.Credit,
        paymentType: transferType,
        originatingAccountId: UUID.get(),
        receivingAccountId: UUID.get(),
        createdAt: new Date(),
        modifiedAt: new Date(),
      }),
    ],
  });

  _.merge(payload, data);
  return payload;
};

export class UpdateTransferStatusWebhookRequestBuilder extends RequestBuilder<UpdateTransferStatusWebhookRequest> {
  requestSupplier(): UpdateTransferStatusWebhookRequest {
    return buildStubUpdateTransferStatusWebhookRequest(
      TransferPaymentType.Wire,
    );
  }
}
