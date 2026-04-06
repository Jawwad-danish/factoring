import { RequestCommand } from '@module-cqrs';
import { ClientFactoringConfigsEntity } from '@module-persistence/entities';
import { CreateClientRequest } from '../../data';

export class CreateClientCommand extends RequestCommand<
  CreateClientRequest,
  ClientFactoringConfigsEntity
> {
  constructor(request: CreateClientRequest) {
    super(request);
  }
}
