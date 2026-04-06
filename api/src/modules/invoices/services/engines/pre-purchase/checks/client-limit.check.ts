import { InvoiceRepository } from '@module-persistence/repositories';
import { Injectable } from '@nestjs/common';
import Big from 'big.js';
import {
  PrePurchaseCheck,
  PrePurchaseCheckCode,
  PrePurchaseCheckInput,
  PrePurchaseCheckResult,
} from '../../../../data';

@Injectable()
export class ClientLimitCheck implements PrePurchaseCheck {
  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async run(
    input: PrePurchaseCheckInput,
  ): Promise<PrePurchaseCheckResult | null> {
    const { payload, invoice, client } = input;
    if (client.factoringConfig.clientLimitAmount === null) {
      return null;
    }

    const arAmount =
      await this.invoiceRepository.getLast30DaysTotalARUnpaidByClient(
        client.id,
      );

    const invoiceAmount =
      payload.deduction !== undefined
        ? invoice.value.minus(payload.deduction)
        : invoice.value;

    const newTotal = new Big(arAmount).plus(invoiceAmount);

    if (newTotal.lte(client.factoringConfig.clientLimitAmount)) {
      return null;
    }

    return {
      note: 'Client limit exceeded',
      details: {
        cause: 'Client limit exceeded',
        clientLimit: client.factoringConfig.clientLimitAmount.toString(),
        newTotal: newTotal.toString(),
      },
      code: PrePurchaseCheckCode.ClientLimitExceeded,
    };
  }
}
