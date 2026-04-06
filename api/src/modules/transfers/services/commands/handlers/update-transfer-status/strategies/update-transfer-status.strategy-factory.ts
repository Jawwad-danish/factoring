import { PaymentType } from '@module-persistence';
import { Injectable } from '@nestjs/common';
import { AchUpdateTransferStatusStrategy } from './ach-update-transfer-status.strategy';
import { BaseUpdateTransferStatusStrategy } from './base-update-transfer-status.strategy';
import { DebitUpdateTransferStatusStrategy } from './debit-update-transfer-status.strategy';
import { WireUpdateTransferStatusStrategy } from './wire-update-transfer-status.strategy';

@Injectable()
export class UpdateTransferStatusStrategyFactory {
  constructor(
    private readonly achStrategy: AchUpdateTransferStatusStrategy,
    private readonly wireStrategy: WireUpdateTransferStatusStrategy,
    private readonly debitStrategy: DebitUpdateTransferStatusStrategy,
  ) {}

  getStrategy(paymentType: PaymentType): BaseUpdateTransferStatusStrategy {
    switch (paymentType) {
      case PaymentType.ACH:
        return this.achStrategy;
      case PaymentType.WIRE:
        return this.wireStrategy;
      case PaymentType.DEBIT:
        return this.debitStrategy;
      default:
        throw new Error(`Unknown payment type: ${paymentType}`);
    }
  }
}
