import { RequestCommand } from '@module-cqrs';
import { BrokerPaymentEntity } from '../../../persistence';
import { CreateBrokerPaymentRequest } from '../../data';

export class CreateBrokerPaymentCommand extends RequestCommand<
  CreateBrokerPaymentRequest,
  BrokerPaymentEntity
> {
  constructor(request: CreateBrokerPaymentRequest) {
    super(request);
  }
}
