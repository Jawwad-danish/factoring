import { RequestCommand } from '@module-cqrs';
import { BrokerPaymentEntity } from '@module-persistence/entities';
import { UpdateBrokerPaymentRequest } from '../../data';

export class UpdateBrokerPaymentCommand extends RequestCommand<
  UpdateBrokerPaymentRequest,
  BrokerPaymentEntity
> {
  constructor(
    readonly brokerPaymentId: string,
    request: UpdateBrokerPaymentRequest,
  ) {
    super(request);
  }
}
