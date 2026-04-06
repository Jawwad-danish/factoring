import { RequestCommand } from '@module-cqrs';
import { ReserveEntity } from '@module-persistence/entities';
import { CreateReserveRequest } from '../../data';

export class CreateReserveCommand extends RequestCommand<
  CreateReserveRequest,
  ReserveEntity
> {
  constructor(readonly clientId: string, request: CreateReserveRequest) {
    super(request);
  }
}
