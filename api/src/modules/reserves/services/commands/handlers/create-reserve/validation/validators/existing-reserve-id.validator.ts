import { ValidationError } from '@core/validation';
import { ReserveRepository } from '@module-persistence/repositories';
import { Injectable, Logger } from '@nestjs/common';
import { CreateReserveCommand } from '../../../../create-reserve.command';
import { ReserveContext, ReserveValidator } from '../../../common';

@Injectable()
export class ExistingReserveIdValidator
  implements ReserveValidator<CreateReserveCommand>
{
  private logger = new Logger(ExistingReserveIdValidator.name);

  constructor(private reserveRepository: ReserveRepository) {}

  async validate({
    command,
  }: ReserveContext<CreateReserveCommand>): Promise<void> {
    const { request } = command;
    if (request.id) {
      const found = await this.reserveRepository.findOneById(request.id);
      if (found) {
        this.logger.error(
          `Could not create reserve because id already exists`,
          {
            id: request.id,
          },
        );
        throw new ValidationError(
          'existing-reserve-id',
          `Could not create reserve because id ${request.id} already exists.`,
        );
      }
    }
  }
}
