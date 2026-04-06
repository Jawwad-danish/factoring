import { BaseModel } from '@core/data';
import { ClientBrokerAssignmentStatus } from '@module-persistence/entities';

export class ReleaseClientBrokerAssignmentResult extends BaseModel<ReleaseClientBrokerAssignmentResult> {
  constructor(
    readonly status: ClientBrokerAssignmentStatus,
    readonly url: string,
  ) {
    super();
  }
}
