import { Expose } from 'class-transformer';
import { PrePurchaseCheckResult } from './types';

export class InvoicePrePurchaseCheck {
  @Expose()
  requiresAttention: boolean;

  @Expose()
  message: string;

  @Expose()
  warnings: PrePurchaseCheckResult[];
}
