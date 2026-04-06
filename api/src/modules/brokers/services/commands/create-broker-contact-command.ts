import { RequestCommand } from '@module-cqrs';
import { BrokerContact } from '../../data/model';
import { CreateBrokerContactRequest } from '../../data/web';

export class CreateBrokerContactCommand extends RequestCommand<
  CreateBrokerContactRequest,
  BrokerContact
> {
  constructor(readonly id: string, request: CreateBrokerContactRequest) {
    super(request);
  }
}
