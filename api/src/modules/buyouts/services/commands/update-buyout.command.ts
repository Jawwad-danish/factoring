import { RequestCommand } from '@module-cqrs';
import { PendingBuyoutEntity } from '@module-persistence/entities';
import { UpdateBuyoutRequest } from '@fs-bobtail/factoring/data';

export class UpdateBuyoutCommand extends RequestCommand<
  UpdateBuyoutRequest,
  PendingBuyoutEntity
> {
  constructor(readonly id: string, readonly request: UpdateBuyoutRequest) {
    super(request);
  }
}
