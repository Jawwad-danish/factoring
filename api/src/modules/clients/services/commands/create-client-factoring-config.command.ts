import { RequestCommand } from '@module-cqrs';
import {
  ClientConfigUser,
  CreateClientFactoringConfigRequest,
} from '../../data';

export class CreateClientFactoringConfigCommand extends RequestCommand<
  CreateClientFactoringConfigRequest,
  ClientConfigUser
> {
  constructor(request: CreateClientFactoringConfigRequest) {
    super(request);
  }
}
