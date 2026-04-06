import { Client } from '@module-clients';
import { PurchaseInvoiceRequest } from '..';
import { InvoiceEntity } from '@module-persistence';

export enum PrePurchaseCheckCode {
  ClientLimitExceeded = 'CLIENT_LIMIT_EXCEEDED',
}

export interface PrePurchaseCheckResult {
  note: string;
  details: Record<string, any>;
  code: PrePurchaseCheckCode;
}

export interface PrePurchaseCheckInput {
  invoice: InvoiceEntity;
  payload: PurchaseInvoiceRequest;
  client: Client;
}

export interface PrePurchaseCheck {
  run(input: PrePurchaseCheckInput): Promise<PrePurchaseCheckResult | null>;
}
