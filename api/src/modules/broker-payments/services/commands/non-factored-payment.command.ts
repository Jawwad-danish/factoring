import { RequestCommand } from '@module-cqrs';
import { BrokerPaymentEntity } from '@module-persistence/entities';
import { CreateBrokerPaymentRequest } from '../../data';

export class NonFactoredPaymentCommand extends RequestCommand<
  CreateBrokerPaymentRequest,
  BrokerPaymentEntity
> {
  constructor(request: CreateBrokerPaymentRequest) {
    super(request);
  }
}
