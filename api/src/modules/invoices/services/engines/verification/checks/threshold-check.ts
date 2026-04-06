import * as formulas from '@core/formulas';
import { Injectable, Logger } from '@nestjs/common';
import { buildCheckResult } from './util';
import {
  VerificationCheckResult,
  VerificationRequiredCheck,
  VerificationEngineInput,
} from '../verification-engine.types';

const THRESHOLD = formulas.dollarsToPennies(4000);

@Injectable()
export class ThresholdCheck implements VerificationRequiredCheck {
  private logger = new Logger(ThresholdCheck.name);

  async run(
    context: VerificationEngineInput,
  ): Promise<null | VerificationCheckResult> {
    const { invoice } = context;
    if (formulas.totalAmount(invoice).gte(THRESHOLD)) {
      this.logger.debug(
        `Verification is required for invoice id ${invoice.id}. Threshold was crossed`,
      );
      return buildCheckResult(
        'Verification is required. Threshold was crossed',
        'Threshold',
        {
          systemThreshold: THRESHOLD.toNumber(),
          invoiceTotalAmount: formulas.totalAmount(invoice).toNumber(),
        },
      );
    }
    return null;
  }
}
