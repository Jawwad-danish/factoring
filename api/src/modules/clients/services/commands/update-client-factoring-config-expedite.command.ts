import { RequestCommand } from '@module-cqrs';
import { ClientFactoringConfigsEntity } from '@module-persistence/entities';
import { UpdateClientFactoringConfigExpediteRequest } from '../../data';

export class UpdateClientFactoringConfigExpediteCommand extends RequestCommand<
  UpdateClientFactoringConfigExpediteRequest,
  ClientFactoringConfigsEntity
> {
  constructor(
    readonly clientId: string,
    request: UpdateClientFactoringConfigExpediteRequest,
  ) {
    super(request);
  }
}
