import { RequestCommand } from '@module-cqrs';
import { BrokerFactoringConfigEntity } from '@module-persistence';
import { UpdateBrokerRequest } from '../../data/web';

export class UpdateBrokerCommand extends RequestCommand<
  UpdateBrokerRequest,
  BrokerFactoringConfigEntity
> {
  constructor(readonly brokerId: string, request: UpdateBrokerRequest) {
    super(request);
  }
}
