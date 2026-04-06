import { RequestCommand } from '@module-cqrs';
import { SendNoaRequest } from '../../data';

export class SendNoaCommand extends RequestCommand<SendNoaRequest, void> {
  constructor(request: SendNoaRequest) {
    super(request);
  }
}
