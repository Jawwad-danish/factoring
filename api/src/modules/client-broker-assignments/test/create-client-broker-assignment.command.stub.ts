import { UUID } from '@core/uuid';
import {
  ClientBrokerAssignmentStatus,
  CreateClientDebtorAssignmentRequest,
} from '@fs-bobtail/factoring/data';
import { CreateClientBrokerAssignmentCommand } from '../services/commands';

export const buildCreateClientBrokerAssignmentCommand = (
  data?: Partial<CreateClientDebtorAssignmentRequest>,
): CreateClientBrokerAssignmentCommand => {
  const request = new CreateClientDebtorAssignmentRequest();
  request.clientId = data?.clientId ?? UUID.get();
  request.brokerId = data?.brokerId ?? UUID.get();
  request.status = data?.status ?? ClientBrokerAssignmentStatus.Sent;

  return new CreateClientBrokerAssignmentCommand(request);
};
