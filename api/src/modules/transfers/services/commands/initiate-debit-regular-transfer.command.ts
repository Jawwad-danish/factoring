import { RequestCommand } from '@module-cqrs';
import { ClientBatchPaymentEntity } from '@module-persistence/entities';
import { InitiateDebitRegularTransferRequest } from '../../data';

export class InitiateDebitRegularTransferCommand extends RequestCommand<
  InitiateDebitRegularTransferRequest,
  ClientBatchPaymentEntity
> {
  constructor(request: InitiateDebitRegularTransferRequest) {
    super(request);
  }
}
