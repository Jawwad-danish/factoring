import { RequestCommand } from '@module-cqrs';
import { UpdateClientDocumenRequest } from '../../data/web';
import { ClientDocument } from '@module-clients/data';

export class UpdateClientDocumentCommand extends RequestCommand<
  UpdateClientDocumenRequest,
  ClientDocument
> {
  constructor(
    readonly clientId: string,
    readonly documentId: string,
    request: UpdateClientDocumenRequest,
  ) {
    super(request);
  }
}
