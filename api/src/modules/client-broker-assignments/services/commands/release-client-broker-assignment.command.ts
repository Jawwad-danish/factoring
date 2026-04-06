import { RequestCommand } from '@module-cqrs';
import {
  ReleaseBrokerRequest,
  ReleaseClientBrokerAssignmentResult,
} from '../../data';

export class ReleaseClientBrokerAssignmentCommand extends RequestCommand<
  ReleaseBrokerRequest,
  ReleaseClientBrokerAssignmentResult
> {}
