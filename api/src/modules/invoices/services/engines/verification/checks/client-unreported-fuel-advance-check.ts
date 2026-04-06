import { TagDefinitionKey } from '@module-persistence/entities';
import { Injectable, Logger } from '@nestjs/common';
import { ClientTagRepository } from '@module-persistence/repositories';
import { buildCheckResult } from './util';
import {
  VerificationCheckResult,
  VerificationRequiredCheck,
  VerificationEngineInput,
} from '../verification-engine.types';

@Injectable()
export class ClientUnreportedFuelAdvanceCheck
  implements VerificationRequiredCheck
{
  constructor(private readonly clientTagRepository: ClientTagRepository) {}

  private logger = new Logger(ClientUnreportedFuelAdvanceCheck.name);

  async run(
    input: VerificationEngineInput,
  ): Promise<null | VerificationCheckResult> {
    const { client } = input;
    const clientTags = await this.clientTagRepository.findByClientId(client.id);
    const hasUnreportedFuelAdvance = clientTags.some(
      (tag) =>
        tag.tagDefinition.key === TagDefinitionKey.UNREPORTED_FUEL_ADVANCE,
    );
    if (hasUnreportedFuelAdvance) {
      this.logger.debug(
        `Verification is required. Client ${client.id} has unreported fuel advance.`,
      );
      return buildCheckResult(
        'Verification is required. Client has unreported fuel advance.',
        'UnreportedFuelAdvance',
        {
          client: {
            id: client.id,
            name: client.name,
          },
        },
      );
    }
    return null;
  }
}
