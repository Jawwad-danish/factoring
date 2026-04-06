import { ValidationError } from '@core/validation';
import { DeleteReserveCommand } from '../../../../delete-reserve.command';
import { ReserveContext, ReserveValidator } from '../../../common';
import {
  REVERSED_RESERVE_PAYLOAD_KEY,
  REVERSING_RESERVE_PAYLOAD_KEY,
} from '../../delete-reserve.command-handler';

export class IsDeletedValidator
  implements ReserveValidator<DeleteReserveCommand>
{
  async validate({
    reserve,
  }: ReserveContext<DeleteReserveCommand>): Promise<void> {
    if (reserve.payload[REVERSING_RESERVE_PAYLOAD_KEY]) {
      throw new ValidationError(
        'invalid-reserve-delete',
        'Cannot delete a reserve that deletes another reserve',
      );
    }

    if (reserve.payload[REVERSED_RESERVE_PAYLOAD_KEY]) {
      throw new ValidationError(
        'invalid-reserve-delete',
        'Cannot delete a reserve that is already deleted',
      );
    }
  }
}
