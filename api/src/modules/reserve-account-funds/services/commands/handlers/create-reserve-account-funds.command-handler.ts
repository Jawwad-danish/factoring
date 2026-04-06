import { BasicCommandHandler } from '@module-cqrs';
import { ReserveAccountFundsEntity } from '@module-persistence/entities';
import { ReserveAccountFundsRepository } from '@module-persistence/repositories';
import { CommandHandler } from '@nestjs/cqrs';
import { CreateReserveAccountFundsCommand } from '../create-reserve-account-funds.command';

@CommandHandler(CreateReserveAccountFundsCommand)
export class CreateReserveAccountFundsCommandHandler
  implements BasicCommandHandler<CreateReserveAccountFundsCommand>
{
  constructor(private readonly repository: ReserveAccountFundsRepository) {}

  async execute(
    command: CreateReserveAccountFundsCommand,
  ): Promise<ReserveAccountFundsEntity> {
    const entity = this.buildEntity(command);
    this.repository.persist(entity);
    return entity;
  }

  private buildEntity({
    request,
    clientId,
  }: CreateReserveAccountFundsCommand): ReserveAccountFundsEntity {
    const entity = new ReserveAccountFundsEntity();
    if (request.id) {
      entity.id = request.id;
    }
    entity.clientId = clientId;
    entity.amount = request.amount;
    entity.note = request.note;
    return entity;
  }
}
