import { RequestCommand } from '@module-cqrs';
import { UpdateTransferStatusWebhookRequest } from '../../data/update-transfer-status-webhook.request';

export class UpdateTransferStatusCommand extends RequestCommand<
  UpdateTransferStatusWebhookRequest,
  void
> {
  constructor(request: UpdateTransferStatusWebhookRequest) {
    super(request);
  }
}
