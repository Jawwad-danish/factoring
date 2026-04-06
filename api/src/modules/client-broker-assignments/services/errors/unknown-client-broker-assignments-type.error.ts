import { CauseAwareError, Reason } from '@core/errors';
import { ClientBrokerAssignmentStatusFilter } from '../queries/handlers/find-client-broker-assignments.filter-criteria';

export class UnknownClientBrokerAssignmentStatusError extends CauseAwareError {
  constructor(status: ClientBrokerAssignmentStatusFilter) {
    super(
      'unknown-client-broker-assignment-status',
      `Unknown client broker assignment status ${status}`,
    );
  }

  getReason(): Reason {
    return Reason.Validation;
  }
}
