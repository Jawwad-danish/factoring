import { ClientPaymentRepository, RecordStatus } from '@module-persistence';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  FindClientPaymentsQuery,
  FindClientPaymentsQueryResult,
} from '../find-client-payments.query';
import { LoadStrategy } from '@mikro-orm/core';

@QueryHandler(FindClientPaymentsQuery)
export class FindClientPaymentsQueryHandler
  implements
    IQueryHandler<FindClientPaymentsQuery, FindClientPaymentsQueryResult>
{
  constructor(
    private readonly clientPaymentsRepository: ClientPaymentRepository,
  ) {}
  async execute(
    query: FindClientPaymentsQuery,
  ): Promise<FindClientPaymentsQueryResult> {
    const [entities, count] =
      await this.clientPaymentsRepository.findByQueryCriteria(query.criteria, {
        additionalWhereClause: {
          recordStatus: RecordStatus.Active,
          clientId: query.clientId,
        },
        populate: [
          'createdBy',
          'reservePayments.reserve',
          'invoicePayments.invoice',
        ],
        strategy: LoadStrategy.SELECT_IN,
      });

    return { clientPaymentEntities: entities, count };
  }
}
