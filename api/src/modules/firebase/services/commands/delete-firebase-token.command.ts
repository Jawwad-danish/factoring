import { RequestCommand } from '@module-cqrs';
import { DeleteFirebaseTokenRequest } from '../../data';

export class DeleteFirebaseTokenCommand extends RequestCommand<
  DeleteFirebaseTokenRequest,
  void
> {
  constructor(
    readonly token: string,
    readonly userId: string,
    request: DeleteFirebaseTokenRequest,
  ) {
    super(request);
  }
}
