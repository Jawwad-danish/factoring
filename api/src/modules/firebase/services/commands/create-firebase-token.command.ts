import { RequestCommand } from '@module-cqrs';
import { CreateFirebaseTokenRequest } from '../../data';

export class CreateFirebaseTokenCommand extends RequestCommand<
  CreateFirebaseTokenRequest,
  string
> {
  constructor(
    readonly userId: string,
    readonly request: CreateFirebaseTokenRequest,
  ) {
    super(request);
  }
}
