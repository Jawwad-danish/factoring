import { ValidationError } from '@core/validation';
import { ReserveReason } from '@module-persistence/entities';
import { ReserveRepository } from '@module-persistence/repositories';
import { Injectable, Logger } from '@nestjs/common';
import Big from 'big.js';
import { CreateReserveCommand } from '../../../../create-reserve.command';
import { ReserveContext, ReserveValidator } from '../../../common';

@Injectable()
export class ReleaseOfFundsValidator
  implements ReserveValidator<CreateReserveCommand>
{
  private logger = new Logger(ReleaseOfFundsValidator.name);

  constructor(private reserveRepository: ReserveRepository) {}

  async validate({
    command,
    reserve,
  }: ReserveContext<CreateReserveCommand>): Promise<void> {
    if (reserve.reason !== ReserveReason.ReleaseOfFunds) {
      this.logger.debug(
        'Skipping release of funds validator because of reserve reason',
        {
          reason: reserve.reason,
        },
      );
      return;
    }

    const total = new Big(
      await this.reserveRepository.getTotalByClient(command.clientId),
    );

    if (total.lte(0)) {
      this.logger.debug('Release of funds reserve cannot be created', {
        reserveAmount: reserve.amount.toNumber(),
        totalReserveAmount: total.toNumber(),
      });
      throw new ValidationError(
        'release-of-funds',
        'Cannot create a release of funds reserve because the total reserves of the client is negative',
      );
    }

    if (reserve.amount.abs().gt(total)) {
      this.logger.debug('Release of funds reserve cannot be created', {
        reserveAmount: reserve.amount.toNumber(),
        totalReserveAmount: total.toNumber(),
      });
      throw new ValidationError(
        'release-of-funds',
        'Cannot create a release of funds reserve because reserve amount is greater than the total reserves of the client',
      );
    }
  }
}
