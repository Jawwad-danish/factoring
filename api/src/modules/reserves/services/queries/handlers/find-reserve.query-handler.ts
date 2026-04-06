import { EntityNotFoundError } from '@core/errors';
import { RecordStatus } from '@module-persistence/entities';
import { ReserveRepository } from '@module-persistence/repositories';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  FindReserveQuery,
  FindReserveQueryResult,
} from '../find-reserve.query';

@QueryHandler(FindReserveQuery)
export class FindReserveQueryHandler
  implements IQueryHandler<FindReserveQuery, FindReserveQueryResult>
{
  constructor(private reserveRepository: ReserveRepository) {}

  async execute(query: FindReserveQuery): Promise<FindReserveQueryResult> {
    const reserve = await this.reserveRepository.findOne(
      {
        id: query.reserveId,
        clientId: query.clientId,
        recordStatus: RecordStatus.Active,
      },
      {
        populate: ['createdBy', 'reserveClientPayments.clientPayment'],
      },
    );
    if (!reserve) {
      throw new EntityNotFoundError(
        `Could not find reserve with id ${query.reserveId}`,
      );
    }
    const totalAmount = await this.reserveRepository.getTotalByClient(
      query.clientId,
      {
        from: reserve.createdAt,
      },
    );

    return {
      reserve: reserve,
      totalAmount,
    };
  }
}
