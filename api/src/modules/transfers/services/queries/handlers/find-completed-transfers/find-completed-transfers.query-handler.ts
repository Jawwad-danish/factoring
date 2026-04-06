import { FindOptions, LoadStrategy, ObjectQuery } from '@mikro-orm/core';
import { BasicQueryHandler } from '@module-cqrs';
import {
  ClientBatchPaymentEntity,
  RecordStatus,
} from '@module-persistence/entities';
import {
  ClientBatchPaymentRepository,
  mapToFindOptions,
} from '@module-persistence/repositories';
import { QueryHandler } from '@nestjs/cqrs';
import { FindCompletedTransfersFilterCriteria } from '../../data';
import {
  FindCompletedTransfersQuery,
  FindCompletedTransfersQueryResult,
} from '../../find-completed-transfers.query';

@QueryHandler(FindCompletedTransfersQuery)
export class FindCompletedTransfersQueryHandler
  implements BasicQueryHandler<FindCompletedTransfersQuery>
{
  constructor(
    private readonly clientBatchPaymentRepository: ClientBatchPaymentRepository,
  ) {}

  async execute({
    criteria,
  }: FindCompletedTransfersQuery): Promise<FindCompletedTransfersQueryResult> {
    const filterCriteria = criteria.mapFiltersToClass(
      FindCompletedTransfersFilterCriteria,
    );
    const whereClause: ObjectQuery<ClientBatchPaymentEntity> = {
      recordStatus: RecordStatus.Active,
    };

    const defaultFindOptions: FindOptions<ClientBatchPaymentEntity, any> = {
      populate: ['clientPayments'],
      orderBy: { createdAt: 'DESC' },
      strategy: LoadStrategy.SELECT_IN,
    };

    const findOptions: FindOptions<ClientBatchPaymentEntity, any> = {
      ...defaultFindOptions,
      ...mapToFindOptions<ClientBatchPaymentEntity>(criteria),
    };

    this.applyClientIdFilter(filterCriteria, whereClause);
    this.applyTypeFilter(filterCriteria, whereClause);
    this.applyStatusFilter(filterCriteria, whereClause);
    this.applyCreatedAtFilter(filterCriteria, whereClause);

    const [batchPayments, count] =
      await this.clientBatchPaymentRepository.findAll(whereClause, findOptions);
    return {
      batchPayments: batchPayments,
      count: count,
    };
  }

  private applyClientIdFilter(
    filterCriteria: FindCompletedTransfersFilterCriteria,
    whereClause: ObjectQuery<ClientBatchPaymentEntity>,
  ): void {
    if (filterCriteria?.clientId?.value) {
      const clientIdFilter = Array.isArray(filterCriteria.clientId.value)
        ? filterCriteria.clientId.value
        : [filterCriteria.clientId.value];
      whereClause.clientPayments = {
        clientId: { $in: clientIdFilter },
      };
    }
  }

  private applyTypeFilter(
    filterCriteria: FindCompletedTransfersFilterCriteria,
    whereClause: ObjectQuery<ClientBatchPaymentEntity>,
  ): void {
    if (filterCriteria.type) {
      whereClause.type = {
        [filterCriteria.type.operator]: filterCriteria.type.value,
      };
    }
  }

  private applyStatusFilter(
    filterCriteria: FindCompletedTransfersFilterCriteria,
    whereClause: ObjectQuery<ClientBatchPaymentEntity>,
  ): void {
    if (filterCriteria.status) {
      whereClause.status = {
        [filterCriteria.status.operator]: filterCriteria.status.value,
      };
    }
  }

  private applyCreatedAtFilter(
    filterCriteria: FindCompletedTransfersFilterCriteria,
    whereClause: ObjectQuery<ClientBatchPaymentEntity>,
  ): void {
    if (filterCriteria.createdAt) {
      if (!whereClause.createdAt) {
        whereClause.createdAt = {};
      }

      const createdAtFilters = Array.isArray(filterCriteria.createdAt)
        ? filterCriteria.createdAt
        : [filterCriteria.createdAt];

      for (const filter of createdAtFilters) {
        whereClause.createdAt[filter.operator] = filter.value;
      }
    }
  }
}
