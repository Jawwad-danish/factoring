import { ValidationError } from '@core/validation';
import { FeatureFlag, FeatureFlagResolver } from '@module-common';
import { ClientFactoringStatus } from '@module-persistence/entities';
import { ClientFactoringConfigsRepository } from '@module-persistence/repositories';
import { Injectable } from '@nestjs/common';
import {
  ClientAwareCommand,
  ReserveContext,
  ReserveValidator,
} from './reserve-validation.types';

@Injectable()
export class ClientStatusValidator<TCommand extends ClientAwareCommand>
  implements ReserveValidator<TCommand>
{
  constructor(
    private readonly clientFactoringConfigRepository: ClientFactoringConfigsRepository,
    private readonly featureFlagResolver: FeatureFlagResolver,
  ) {}

  async validate({ command }: ReserveContext<TCommand>): Promise<void> {
    const config = await this.clientFactoringConfigRepository.getOneByClientId(
      command.clientId,
    );
    if (
      this.featureFlagResolver.isEnabled(
        FeatureFlag.ReservesClientStatusValidator,
      ) &&
      config.status !== ClientFactoringStatus.Active
    ) {
      throw new ValidationError(
        'invalid-client-status',
        'Client must have a valid factoring status',
      );
    }
  }
}
