import { CreateBuyoutsBatchRequest } from '@fs-bobtail/factoring/data';
import { RequestCommand } from '@module-cqrs';
import { PendingBuyoutsBatchEntity } from '@module-persistence/entities';

export class CreateBuyoutsBatchCommand extends RequestCommand<
  CreateBuyoutsBatchRequest,
  PendingBuyoutsBatchEntity
> {
  constructor(readonly request: CreateBuyoutsBatchRequest) {
    super(request);
  }
}
