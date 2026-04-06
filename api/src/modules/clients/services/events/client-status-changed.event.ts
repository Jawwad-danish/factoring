import { BaseModel } from '@core/data';
import {
  ClientFactoringStatus,
  ClientStatusReason,
} from '@module-persistence/entities';

export interface ClientStatusChange {
  clientId: string;
  initialStatus: ClientFactoringStatus;
  updatedStatus: ClientFactoringStatus;
  reason: ClientStatusReason;
}

export class ClientStatusChangedEvent extends BaseModel<ClientStatusChangedEvent> {
  static readonly EVENT_NAME: string = 'client.status-changed';

  constructor(readonly clientStatusChanges: ClientStatusChange[]) {
    super();
  }
}
