import { RequestCommand } from '@module-cqrs';
import { ReserveEntity } from '@module-persistence/entities';
import { DeleteReserveRequest } from '../../data';

export class DeleteReserveCommand extends RequestCommand<
  DeleteReserveRequest,
  ReserveEntity
> {
  constructor(
    readonly clientId: string,
    readonly reserveId: string,
    request: DeleteReserveRequest,
  ) {
    super(request);
  }
}
