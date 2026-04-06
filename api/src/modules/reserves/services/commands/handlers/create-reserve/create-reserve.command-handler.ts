import { BasicCommandHandler } from '@module-cqrs';
import { ReserveEntity, ReserveRepository } from '@module-persistence';
import { CommandHandler } from '@nestjs/cqrs';
import { instanceToPlain } from 'class-transformer';
import { CreateReserveCommand } from '../../create-reserve.command';
import { reserveDataFromRequest } from './reserve-data-factory';
import { CreateReserveValidationService } from './validation';

@CommandHandler(CreateReserveCommand)
export class CreateReserveCommandHandler
  implements BasicCommandHandler<CreateReserveCommand>
{
  constructor(
    private readonly repository: ReserveRepository,
    private readonly validationService: CreateReserveValidationService,
  ) {}

  async execute(command: CreateReserveCommand): Promise<ReserveEntity> {
    const reserve = this.buildReserveEntity(command);
    await this.validationService.validate({ command, reserve });
    this.repository.persist(reserve);
    return reserve;
  }

  private buildReserveEntity({
    request,
    clientId,
  }: CreateReserveCommand): ReserveEntity {
    const reserveData = reserveDataFromRequest(request);
    const entity = new ReserveEntity();
    if (request.id) {
      entity.id = request.id;
    }
    entity.clientId = clientId;
    entity.amount = reserveData.amount;
    entity.payload = instanceToPlain(request.payload, {
      excludeExtraneousValues: true,
    });
    entity.reason = reserveData.reason;
    entity.note = request.note || reserveData.note;
    return entity;
  }
}
