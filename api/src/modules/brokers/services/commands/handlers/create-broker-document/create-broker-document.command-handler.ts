import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateBrokerDocumentCommand } from '../../create-broker-document.command';
import { BrokerDocument } from '../../../../data/model';
import { BrokerApi } from '../../../../api';
import { BrokerDocumentsMapper } from '../../../../data/mappers';

@CommandHandler(CreateBrokerDocumentCommand)
export class CreateBrokerDocumentCommandHandler
  implements ICommandHandler<CreateBrokerDocumentCommand, BrokerDocument>
{
  constructor(
    private readonly brokerApi: BrokerApi,
    private readonly brokerDocumentsMapper: BrokerDocumentsMapper,
  ) {}

  async execute({
    brokerId,
    request,
  }: CreateBrokerDocumentCommand): Promise<BrokerDocument> {
    const brokerDocumentResposne = await this.brokerApi.createBrokerDocument(
      brokerId,
      request,
    );
    const brokerDocument =
      await this.brokerDocumentsMapper.brokerDocumentResponseToModel(
        brokerDocumentResposne,
      );
    return brokerDocument;
  }
}
