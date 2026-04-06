import { Command } from '@module-cqrs';
import {
  ClientFactoringStatus,
  ClientStatusReason,
} from '@module-persistence/entities';

export interface UpdateClientsFromInactivityResult {
  changes: {
    clientId: string;
    initialStatus: ClientFactoringStatus;
    updatedStatus: ClientFactoringStatus;
    reason: ClientStatusReason;
  }[];
}

export class UpdateClientsFromInactivityCommand extends Command<UpdateClientsFromInactivityResult> {}
