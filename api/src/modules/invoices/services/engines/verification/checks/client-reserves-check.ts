import {
  InvoiceRepository,
  ReserveRepository,
} from '@module-persistence/repositories';
import { Injectable, Logger } from '@nestjs/common';
import Big from 'big.js';
import {
  VerificationCheckResult,
  VerificationEngineInput,
  VerificationRequiredCheck,
} from '../verification-engine.types';
import { buildCheckResult } from './util';

@Injectable()
export class ClientReservesCheck implements VerificationRequiredCheck {
  private logger = new Logger(ClientReservesCheck.name);
  constructor(
    private readonly reservesRepository: ReserveRepository,
    private readonly invoiceRepository: InvoiceRepository,
  ) {}

  async run(
    input: VerificationEngineInput,
  ): Promise<null | VerificationCheckResult> {
    const { invoice } = input;
    const totalReserves = await this.reservesRepository.getTotalByClient(
      invoice.clientId,
    );
    const totalUnpaid =
      await this.invoiceRepository.getLast30DaysTotalARUnpaidByClient(
        invoice.clientId,
      );
    const targetUnpaidPercentage = Big(totalUnpaid).times(0.05).neg();
    if (new Big(totalReserves).lt(targetUnpaidPercentage)) {
      this.logger.debug(
        `Verification is required for invoice id ${invoice.id}. Client reserves ${totalReserves} is not within bounds`,
      );
      return buildCheckResult(
        'Verification is required. Client reserves is not within bounds',
        'ClientReserves',
        {
          client: {
            reserve: totalReserves,
            requiredReserve: targetUnpaidPercentage.toNumber(),
          },
        },
      );
    }
    return null;
  }
}
