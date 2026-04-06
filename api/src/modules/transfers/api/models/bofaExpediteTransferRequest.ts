import { BofaPaymentRequest } from './bofaRtpPaymentRequest';
import { TransferType } from './transfer-type';

export interface BofaTransferRequest {
  batchPaymentId: string;
  metadata?: any;
  webhookClientURL?: string;
  transferType: TransferType;
  payments: Array<BofaPaymentRequest>;
}
