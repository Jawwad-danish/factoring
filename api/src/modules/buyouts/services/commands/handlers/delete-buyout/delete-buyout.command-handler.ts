import { BasicCommandHandler } from '@module-cqrs';
import { RecordStatus } from '@module-persistence';
import { PendingBuyoutEntity } from '@module-persistence/entities';
import { PendingBuyoutRepository } from '@module-persistence/repositories';
import { CommandHandler } from '@nestjs/cqrs';
import { DeleteBuyoutCommand } from '../../delete-buyout.command';

@CommandHandler(DeleteBuyoutCommand)
export class DeleteBuyoutCommandHandler
  implements BasicCommandHandler<DeleteBuyoutCommand>
{
  constructor(
    private readonly pendingBuyoutRepository: PendingBuyoutRepository,
  ) {}

  async execute(command: DeleteBuyoutCommand): Promise<PendingBuyoutEntity> {
    const entity = await this.pendingBuyoutRepository.getOneById(
      command.buyoutId,
    );
    entity.recordStatus = RecordStatus.Inactive;
    return entity;
  }
}
