import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateClientBrokerAssignmentCommand } from '../../commands';
import {
  ClientBrokerAssignmentEntity,
  ClientBrokerAssignmentAssocEntity,
  ClientBrokerAssignmentRepository,
} from '@module-persistence';

@CommandHandler(CreateClientBrokerAssignmentCommand)
export class CreateClientBrokerAssignmentHandler
  implements
    ICommandHandler<
      CreateClientBrokerAssignmentCommand,
      ClientBrokerAssignmentEntity
    >
{
  constructor(private readonly repository: ClientBrokerAssignmentRepository) {}

  async execute(
    command: CreateClientBrokerAssignmentCommand,
  ): Promise<ClientBrokerAssignmentEntity> {
    const { clientId, brokerId, status } = command.request;

    const entity = new ClientBrokerAssignmentEntity();
    entity.clientId = clientId;
    entity.brokerId = brokerId;
    entity.status = status;

    const historyEntry = new ClientBrokerAssignmentAssocEntity();
    historyEntry.status = status;
    entity.assignmentHistory.add(historyEntry);

    await this.repository.persistAndFlush(entity);

    return entity;
  }
}
