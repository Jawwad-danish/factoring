import { RequestCommand } from '@module-cqrs';
import { ClientFactoringConfigsEntity } from '@module-persistence/entities';
import { UpdateClientFactoringConfigRequest } from '../../data';

export class UpdateClientFactoringConfigCommand extends RequestCommand<
  UpdateClientFactoringConfigRequest,
  ClientFactoringConfigsEntity
> {
  constructor(
    readonly clientId: string,
    request: UpdateClientFactoringConfigRequest,
  ) {
    super(request);
  }
}
