import { Injectable, Logger } from '@nestjs/common';
import { buildCheckResult } from './util';
import {
  VerificationCheckResult,
  VerificationRequiredCheck,
  VerificationEngineInput,
} from '../verification-engine.types';

@Injectable()
export class ClientRequiresVerificationCheck
  implements VerificationRequiredCheck
{
  private logger = new Logger(ClientRequiresVerificationCheck.name);

  async run(
    context: VerificationEngineInput,
  ): Promise<null | VerificationCheckResult> {
    const { invoice, client } = context;
    if (client.factoringConfig.requiresVerification === true) {
      this.logger.debug(
        `Verification is required for invoice id ${invoice.id}. Client requires verification`,
      );
      return buildCheckResult(
        'Verification is required. Client requires verification',
        'ClientRequiresVerification',
        {
          client: {
            id: client.id,
            name: client.name,
            requiresVerification: client.factoringConfig.requiresVerification,
          },
        },
      );
    }
    return null;
  }
}
