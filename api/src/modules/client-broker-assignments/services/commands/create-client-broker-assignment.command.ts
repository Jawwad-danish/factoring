import { RequestCommand } from '@module-cqrs';
import { CreateClientDebtorAssignmentRequest } from '@fs-bobtail/factoring/data';
import { ClientBrokerAssignmentEntity } from '@module-persistence';

export class CreateClientBrokerAssignmentCommand extends RequestCommand<
  CreateClientDebtorAssignmentRequest,
  ClientBrokerAssignmentEntity
> {
  constructor(request: CreateClientDebtorAssignmentRequest) {
    super(request);
  }
}
