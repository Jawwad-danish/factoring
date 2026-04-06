import { ClientDocument } from '@module-clients/data';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ClientApi } from '../../../../api';
import { UpdateClientDocumentCommand } from '../../update-client-document.command';

@CommandHandler(UpdateClientDocumentCommand)
export class UpdateClientDocumentCommandHandler
  implements ICommandHandler<UpdateClientDocumentCommand, ClientDocument>
{
  constructor(private readonly clientApi: ClientApi) {}

  async execute(data: UpdateClientDocumentCommand): Promise<ClientDocument> {
    return await this.clientApi.updateDocument(
      data.clientId,
      data.documentId,
      data.request,
    );
  }
}
