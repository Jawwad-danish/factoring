import { ValidationError } from '@core/validation';
import { DeleteReserveCommand } from '../../../../delete-reserve.command';
import { ReserveContext, ReserveValidator } from '../../../common';

export class ReserveIntegrityValidator
  implements ReserveValidator<DeleteReserveCommand>
{
  async validate({
    command,
    reserve,
  }: ReserveContext<DeleteReserveCommand>): Promise<void> {
    if (reserve.clientId !== command.clientId) {
      throw new ValidationError(
        'invalid-reserve',
        'Invalid reserve for client',
      );
    }
  }
}
