import { Command } from '@module-cqrs';
import {
  ClientFactoringStatus,
  ClientStatusReason,
} from '@module-persistence/entities';
import { LightweightClient } from '../../data';

export interface UpdateClientsFromFmcsaResult {
  changes: {
    clientId: string;
    initialStatus: ClientFactoringStatus;
    updatedStatus: ClientFactoringStatus;
    reason: ClientStatusReason;
  }[];
}

export class UpdateClientsFromFmcsaCommand extends Command<UpdateClientsFromFmcsaResult> {
  constructor(readonly clients: LightweightClient[]) {
    super();
  }
}
