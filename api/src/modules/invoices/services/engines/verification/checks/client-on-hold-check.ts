import { ClientFactoringStatus } from '@module-persistence/entities';
import { ClientFactoringConfigsRepository } from '@module-persistence/repositories';
import { Injectable, Logger } from '@nestjs/common';
import { buildCheckResult } from './util';
import {
  VerificationCheckResult,
  VerificationRequiredCheck,
  VerificationEngineInput,
} from '../verification-engine.types';

@Injectable()
export class ClientOnHoldCheck implements VerificationRequiredCheck {
  private logger = new Logger(ClientOnHoldCheck.name);
  constructor(
    private readonly clientFactoringConfigsRepository: ClientFactoringConfigsRepository,
  ) {}

  async run(
    input: VerificationEngineInput,
  ): Promise<null | VerificationCheckResult> {
    const { client } = input;
    const config =
      await this.clientFactoringConfigsRepository.findOneByClientId(client.id);
    if (config?.status === ClientFactoringStatus.Hold) {
      this.logger.debug(
        `Verification is required for client id ${client.id}. Client status is Hold`,
      );
      return buildCheckResult(
        'Verification is required. Client status is Hold',
        'ClientStatus',
        {
          client: {
            id: client.id,
            name: client.name,
            status: config.status,
          },
        },
      );
    }
    return null;
  }
}
