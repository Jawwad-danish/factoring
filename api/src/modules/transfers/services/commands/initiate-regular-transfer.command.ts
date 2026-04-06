import { RequestCommand } from '@module-cqrs';
import { ClientBatchPaymentEntity } from '@module-persistence/entities';
import { InitiateRegularTransferRequest } from '../../data';

export class InitiateRegularTransferCommand extends RequestCommand<
  InitiateRegularTransferRequest,
  ClientBatchPaymentEntity
> {
  constructor(request: InitiateRegularTransferRequest) {
    super(request);
  }
}
