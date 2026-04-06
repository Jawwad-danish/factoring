import { RequestCommand } from '@module-cqrs';
import { ClientFactoringConfigsEntity } from '@module-persistence/entities';
import { UpdateClientRequest } from '../../data';

export class UpdateClientCommand extends RequestCommand<
  UpdateClientRequest,
  ClientFactoringConfigsEntity
> {
  constructor(readonly clientId: string, request: UpdateClientRequest) {
    super(request);
  }
}
