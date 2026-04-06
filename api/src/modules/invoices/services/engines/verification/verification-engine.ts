import { VerificationStatus } from '@module-persistence/entities';
import { Injectable, Logger } from '@nestjs/common';
import { ClientRequiresVerificationCheck } from './checks';
import { AgeDilutionReserveCheck } from './checks/age-dilution-reserve-check';
import { ClientReservesCheck } from './checks/client-reserves-check';
import { ThresholdCheck } from './checks/threshold-check';
import {
  VerificationCheckResult,
  VerificationEngineInput,
  VerificationRequiredCheck,
} from './verification-engine.types';

const skipStatuses = [
  VerificationStatus.Verified,
  VerificationStatus.Bypassed,
  VerificationStatus.Failed,
  VerificationStatus.InProgress,
];

@Injectable()
export class VerificationEngine {
  private logger = new Logger(VerificationEngine.name);
  private checks: VerificationRequiredCheck[];

  constructor(
    private thresholdCheck: ThresholdCheck,
    reservesCheck: ClientReservesCheck,
    ageDilutionReserveCheck: AgeDilutionReserveCheck,
    private clientRequiresVerificationCheck: ClientRequiresVerificationCheck,
  ) {
    this.checks = [
      thresholdCheck,
      reservesCheck,
      ageDilutionReserveCheck,
      clientRequiresVerificationCheck,
    ];
  }

  async runMandatoryChecks(
    input: VerificationEngineInput,
  ): Promise<VerificationCheckResult[]> {
    const results: VerificationCheckResult[] = [];
    for (const check of [
      this.thresholdCheck,
      this.clientRequiresVerificationCheck,
    ]) {
      const checkResult = await check.run(input);
      if (checkResult != null) {
        results.push(checkResult);
      }
    }
    return results;
  }

  async run(
    input: VerificationEngineInput,
  ): Promise<VerificationCheckResult[]> {
    const results: VerificationCheckResult[] = [];
    const { invoice, forceRun } = input;
    if (!forceRun && skipStatuses.includes(invoice.verificationStatus)) {
      this.logger.log('Invoice was verified. Skipping verification engine.', {
        invoice: {
          id: invoice.id,
          loadNumber: invoice.loadNumber,
          verificationStatus: invoice.verificationStatus,
        },
      });
      return results;
    }

    for (const check of this.checks) {
      const checkResult = await check.run(input);
      if (checkResult != null) {
        results.push(checkResult);
      }
    }
    return results;
  }
}
