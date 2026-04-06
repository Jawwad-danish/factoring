import { BasicCommandHandler } from '@module-cqrs';
import { PendingBuyoutEntity } from '@module-persistence/entities';
import { PendingBuyoutRepository } from '@module-persistence/repositories';
import { CommandHandler } from '@nestjs/cqrs';
import { UpdateBuyoutCommand } from '../../update-buyout.command';

@CommandHandler(UpdateBuyoutCommand)
export class UpdateBuyoutCommandHandler
  implements BasicCommandHandler<UpdateBuyoutCommand>
{
  constructor(
    private readonly pendingBuyoutRepository: PendingBuyoutRepository,
  ) {}

  async execute(command: UpdateBuyoutCommand): Promise<PendingBuyoutEntity> {
    const pendingBuyout = await this.pendingBuyoutRepository.getOneById(
      command.id,
    );
    const { loadNumber, paymentDate, rate, brokerName } = command.request;
    if (loadNumber !== undefined) {
      pendingBuyout.loadNumber = loadNumber;
    }
    if (paymentDate !== undefined) {
      pendingBuyout.paymentDate = paymentDate;
    }
    if (rate !== undefined) {
      pendingBuyout.rate = rate;
    }
    if (brokerName !== undefined) {
      pendingBuyout.brokerName = brokerName;
    }
    return pendingBuyout;
  }
}
