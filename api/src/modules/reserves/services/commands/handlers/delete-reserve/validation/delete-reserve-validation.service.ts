import { Injectable } from '@nestjs/common';
import { DeleteReserveCommand } from '../../../delete-reserve.command';
import { ClientStatusValidator, ReserveValidationService } from '../../common';
import { IsDeletedValidator, ReserveIntegrityValidator } from './validators';

@Injectable()
export class DeleteReserveValidationService extends ReserveValidationService<DeleteReserveCommand> {
  constructor(
    clientStatusValidator: ClientStatusValidator<DeleteReserveCommand>,
  ) {
    super([
      clientStatusValidator,
      new IsDeletedValidator(),
      new ReserveIntegrityValidator(),
    ]);
  }
}
