import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateBrokerDocumentCommand } from '../../update-broker-document.command';
import { BrokerDocument } from '../../../../data/model';
import { BrokerApi } from '../../../../api';
import { BrokerDocumentsMapper } from '../../../../data/mappers';

@CommandHandler(UpdateBrokerDocumentCommand)
export class UpdateBrokerDocumentCommandHandler
  implements ICommandHandler<UpdateBrokerDocumentCommand, BrokerDocument>
{
  constructor(
    private readonly brokerApi: BrokerApi,
    private readonly brokerDocumentsMapper: BrokerDocumentsMapper,
  ) {}

  async execute({
    brokerId,
    documentId,
    request,
  }: UpdateBrokerDocumentCommand): Promise<BrokerDocument> {
    const brokerDocumentResponse = await this.brokerApi.updateBrokerDocument(
      brokerId,
      documentId,
      request,
    );
    const brokerDocument =
      await this.brokerDocumentsMapper.brokerDocumentResponseToModel(
        brokerDocumentResponse,
      );
    return brokerDocument;
  }
}
