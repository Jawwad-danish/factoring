import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteBrokerDocumentCommand } from '../../delete-broker-document.command';
import { BrokerApi } from '../../../../api';

@CommandHandler(DeleteBrokerDocumentCommand)
export class DeleteBrokerDocumentCommandHandler
  implements ICommandHandler<DeleteBrokerDocumentCommand, void>
{
  constructor(private readonly brokerApi: BrokerApi) {}

  async execute({
    brokerId,
    documentId,
  }: DeleteBrokerDocumentCommand): Promise<void> {
    return await this.brokerApi.deleteBrokerDocument(brokerId, documentId);
  }
}
