import {
  BatchTransferResponseV1State,
  BatchTransferResponseV1TransferType,
} from './batchTransferResponseV1';
import {
  TransferResponseV1Direction,
  TransferResponseV1PaymentType,
} from './transferResponseV1';

export class BatchTransferResponseV2 {
  id: string;
  state: BatchTransferResponseV1State;
  transferType: BatchTransferResponseV1TransferType;
  batchTransferId: string;
  totalAmount: number;
  metadata: any;
  webhookClientURL?: string;
  transfers: TransferResponseV2[];
}

export class TransferResponseV2 {
  id: string;
  state: BatchTransferResponseV1State;
  amount: number;
  direction: TransferResponseV1Direction;
  paymentType?: BatchTransferResponseV1TransferType;
  paymentProvider: string;
  creditorName: string;
  paymentProviderPaymentId: string;
  paymentProviderE2EIdentification: string;
  fallbackForTransferId?: string;
  fallbackWithTransferId?: string;
  trails: BofAExpediteTransferAuditResponse[];
}

export class BofAExpediteTransferAuditResponse {
  id: string;
  state: BatchTransferResponseV1State;
  paymentType?: TransferResponseV1PaymentType;
  paymentProvider: string;
  paymentProviderPaymentId?: string;
  paymentProviderE2EIdentification?: string;
  paymentProviderPaymentStatus?: string;
  paymentProviderRequestTransportStatus?: string;
  fallbackForTransferId?: string;
  fallbackWithTransferId?: string;
}
