import { RequestCommand } from '@module-cqrs';
import { UpdateUserRequest, UserContext } from '../../data';

export class UpdateUserCommand extends RequestCommand<
  UpdateUserRequest,
  UserContext
> {
  constructor(
    readonly userId: string,
    request: UpdateUserRequest,
    readonly externalServices = false,
  ) {
    super(request);
  }
}
