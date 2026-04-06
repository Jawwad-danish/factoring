import { BaseModel } from '@core/data';
import { Client } from '../client.model';
import { ClientStatusReason } from '@module-persistence';

export class ClientReleasedEvent extends BaseModel<ClientReleasedEvent> {
  client: Client;
  releaseDate: Date;
  releaseReason: ClientStatusReason;
}
