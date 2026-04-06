import { RequestCommand } from '@module-cqrs';
import { ReserveAccountFundsEntity } from '@module-persistence/entities';
import { CreateReserveAccountFundsRequest } from '../../data';

export class CreateReserveAccountFundsCommand extends RequestCommand<
  CreateReserveAccountFundsRequest,
  ReserveAccountFundsEntity
> {
  constructor(
    readonly clientId: string,
    request: CreateReserveAccountFundsRequest,
  ) {
    super(request);
  }
}
