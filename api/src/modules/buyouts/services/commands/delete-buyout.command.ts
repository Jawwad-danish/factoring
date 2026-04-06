import { RequestCommand } from '@module-cqrs';
import { PendingBuyoutEntity } from '@module-persistence/entities';
import { DeleteBuyoutRequest } from '@fs-bobtail/factoring/data';

export class DeleteBuyoutCommand extends RequestCommand<
  DeleteBuyoutRequest,
  PendingBuyoutEntity
> {
  constructor(readonly buyoutId: string, request: DeleteBuyoutRequest) {
    super({ ...request, ingestThrough: true });
  }
}
