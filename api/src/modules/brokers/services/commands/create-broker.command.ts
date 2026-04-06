import { RequestCommand } from '@module-cqrs';
import { BrokerFactoringConfigEntity } from '@module-persistence';
import { CreateBrokerRequest } from '../../data/web';

export class CreateBrokerCommand extends RequestCommand<
  CreateBrokerRequest,
  BrokerFactoringConfigEntity
> {
  constructor(request: CreateBrokerRequest) {
    super(request);
  }
}
