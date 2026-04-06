import { RecordStatus } from '@module-persistence/entities';
import { ReserveAccountFundsRepository } from '@module-persistence/repositories';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  FindReserveAccountFundsQuery,
  FindReserveAccountFundsQueryResult,
} from '../find-reserves.query';

@QueryHandler(FindReserveAccountFundsQuery)
export class FindReserveQueryHandler
  implements
    IQueryHandler<
      FindReserveAccountFundsQuery,
      FindReserveAccountFundsQueryResult
    >
{
  constructor(private repository: ReserveAccountFundsRepository) {}

  async execute(
    query: FindReserveAccountFundsQuery,
  ): Promise<FindReserveAccountFundsQueryResult> {
    const [entities, totalCount] = await this.repository.findByQueryCriteria(
      query.criteria,
      {
        additionalWhereClause: {
          recordStatus: RecordStatus.Active,
          clientId: query.clientId,
        },
        populate: ['createdBy'],
      },
    );
    return {
      entities,
      totalCount,
    };
  }
}
