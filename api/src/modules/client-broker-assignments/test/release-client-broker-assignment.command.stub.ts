import { UUID } from '@core/uuid';
import { ReleaseClientBrokerAssignmentCommand } from '../services/commands';

export const buildReleaseClientBrokerAssignmentCommand =
  (): ReleaseClientBrokerAssignmentCommand => {
    return new ReleaseClientBrokerAssignmentCommand({
      clientId: UUID.get(),
      brokerId: UUID.get(),
    });
  };
