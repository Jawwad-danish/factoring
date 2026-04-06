import { RequestCommand } from '@module-cqrs';
import { UpdateInvoiceExpediteRequest } from '../../data/web';

export class UpdateInvoiceExpeditedCommand extends RequestCommand<
  UpdateInvoiceExpediteRequest,
  void
> {
  constructor(request: UpdateInvoiceExpediteRequest) {
    super(request);
  }
}
