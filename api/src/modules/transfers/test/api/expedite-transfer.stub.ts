import { DeepPartial } from '@core/types';
import { UUID } from '@core/uuid';
import {
  BatchTransferResponseV1,
  BatchTransferResponseV1State,
  BatchTransferResponseV1TransferType,
} from '@module-transfers';

export const buildStubExpediteTransferResponse = (
  data?: DeepPartial<BatchTransferResponseV1>,
): BatchTransferResponseV1 => {
  const model: BatchTransferResponseV1 = {
    id: UUID.get(),
    transferType: BatchTransferResponseV1TransferType.Expedite,
    state: BatchTransferResponseV1State.Processing,
    batchTransferId: UUID.get(),
    totalAmount: 1000,
    metadata: {},
    transfers: [],
  };

  Object.assign(model, data);
  return model;
};
