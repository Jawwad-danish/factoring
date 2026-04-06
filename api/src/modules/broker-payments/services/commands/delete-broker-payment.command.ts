import { RequestCommand } from '@module-cqrs';
import { BrokerPaymentEntity } from '../../../persistence';
import { DeleteBrokerPaymentRequest } from '../../data';

export class DeleteBrokerPaymentCommand extends RequestCommand<
  DeleteBrokerPaymentRequest,
  BrokerPaymentEntity
> {
  constructor(
    readonly brokerPaymentId: string,
    readonly request: DeleteBrokerPaymentRequest,
  ) {
    super(request);
  }
}
