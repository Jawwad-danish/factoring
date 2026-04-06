import { RequestCommand } from '@module-cqrs';
import { BrokerFactoringConfigEntity } from '@module-persistence/entities';
import { UpdateBrokerFactoringConfigRequest } from '../../data/web';

export class UpdateBrokerFactoringConfigCommand extends RequestCommand<
  UpdateBrokerFactoringConfigRequest,
  BrokerFactoringConfigEntity
> {
  constructor(
    readonly brokerId: string,
    request: UpdateBrokerFactoringConfigRequest,
  ) {
    super(request);
  }
}
