import { Injectable, Logger } from '@nestjs/common';
import { ClientLimitCheck } from './checks';
import {
  PrePurchaseCheck,
  PrePurchaseCheckInput,
  PrePurchaseCheckResult,
} from '../../../data';

@Injectable()
export class PrePurchaseCheckEngine {
  private logger = new Logger(PrePurchaseCheckEngine.name);
  private checks: PrePurchaseCheck[];

  constructor(clientLimitCheck: ClientLimitCheck) {
    this.checks = [clientLimitCheck];
  }

  async run(input: PrePurchaseCheckInput): Promise<PrePurchaseCheckResult[]> {
    const results: PrePurchaseCheckResult[] = [];
    for (const check of this.checks) {
      this.logger.debug(`Running check ${check.constructor.name}`);
      const checkResult = await check.run(input);
      if (checkResult != null) {
        results.push(checkResult);
      }
    }
    return results;
  }
}
