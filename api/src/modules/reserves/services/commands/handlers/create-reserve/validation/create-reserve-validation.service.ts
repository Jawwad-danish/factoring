import { Injectable } from '@nestjs/common';
import { CreateReserveCommand } from '../../../create-reserve.command';
import { ClientStatusValidator, ReserveValidationService } from '../../common';
import {
  ExistingReserveIdValidator,
  ReleaseOfFundsValidator,
} from './validators';

@Injectable()
export class CreateReserveValidationService extends ReserveValidationService<CreateReserveCommand> {
  constructor(
    clientStatusValidator: ClientStatusValidator<CreateReserveCommand>,
    existingReserveIdValidator: ExistingReserveIdValidator,
    releaseOfFundsValidator: ReleaseOfFundsValidator,
  ) {
    super([
      clientStatusValidator,
      existingReserveIdValidator,
      releaseOfFundsValidator,
    ]);
  }
}
