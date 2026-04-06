import { DeepPartial } from '@core/types';
import { UUID } from '@core/uuid';
import {
  TransferResponseV2,
  BatchTransferResponseV1State,
  BatchTransferResponseV1TransferType,
  BatchTransferResponseV2,
  TransferResponseV1Direction,
} from '@module-transfers';

export const buildStubExpediteBatchTransferResponseV2 = (
  data?: DeepPartial<BatchTransferResponseV2>,
): BatchTransferResponseV2 => {
  const model = new BatchTransferResponseV2();
  Object.assign(model, {
    id: UUID.get(),
    state: BatchTransferResponseV1State.Completed,
    transferType:
      data?.transferType ?? BatchTransferResponseV1TransferType.Expedite,
    batchTransferId: UUID.get(),
    totalAmount: 1000,
    metadata: { test: true },
    webhookClientURL: 'https://example.com/webhook',
    transfers: [buildStubBofAExpediteTransferResponse()],
    ...data,
  });

  return model;
};

export const buildStubBofAExpediteTransferResponse = (
  data?: DeepPartial<TransferResponseV2>,
): TransferResponseV2 => {
  const model = new TransferResponseV2();
  Object.assign(model, {
    id: UUID.get(),
    state: BatchTransferResponseV1State.Completed,
    amount: 1000,
    direction: TransferResponseV1Direction.Credit,
    paymentType: BatchTransferResponseV1TransferType.Expedite,
    paymentProvider: 'bofa',
    creditorName: 'Test Creditor',
    paymentProviderPaymentId: UUID.get(),
    paymentProviderE2EIdentification: UUID.get(),
    trails: [],
    ...data,
  });

  return model;
};
