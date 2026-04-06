import { RequestCommand } from '@module-cqrs';
import { BrokerContact } from '../../data/model';
import { UpdateBrokerContactRequest } from '../../data/web';

export class UpdateBrokerContactCommand extends RequestCommand<
  UpdateBrokerContactRequest,
  BrokerContact
> {
  constructor(
    readonly id: string,
    readonly contactId: string,
    request: UpdateBrokerContactRequest,
  ) {
    super(request);
  }
}
