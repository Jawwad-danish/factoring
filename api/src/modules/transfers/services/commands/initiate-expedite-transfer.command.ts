import { RequestCommand } from '@module-cqrs';
import { InitiateExpediteTransferRequest } from '../../data';
import { ClientBatchPaymentEntity } from '@module-persistence/entities';

export class InitiateExpediteTransferCommand extends RequestCommand<
  InitiateExpediteTransferRequest,
  ClientBatchPaymentEntity
> {
  constructor(request: InitiateExpediteTransferRequest) {
    super(request);
  }
}
