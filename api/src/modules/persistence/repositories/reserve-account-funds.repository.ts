import { FilterOperator, SortingOrder } from '@core/data';
import { DatabaseService } from '@module-database';
import { Inject, Injectable } from '@nestjs/common';
import { RecordStatus, ReserveAccountFundsEntity } from '../entities';
import {
  QueryCriteriaConfiguration,
  QueryCriteriaRepository,
} from './basic-repository';
import { QBFilterQuery, raw } from '@mikro-orm/core';

@Injectable()
export class ReserveAccountFundsRepository extends QueryCriteriaRepository<ReserveAccountFundsEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, ReserveAccountFundsEntity);
  }

  protected getQueryCriteriaConfiguration(): QueryCriteriaConfiguration<ReserveAccountFundsEntity> {
    return {
      sortableColumns: {
        createdAt: new Set([SortingOrder.ASC, SortingOrder.DESC]),
      },
      defaultSortableColumns: {
        createdAt: SortingOrder.DESC,
      },
      searchableColumns: {
        id: new Set([FilterOperator.EQ]),
        clientId: new Set([FilterOperator.EQ]),
      },
      pagination: {
        maxItemsPerPage: 100,
      },
    };
  }

  async getTotalForClient(clientId: string): Promise<number> {
    const where: QBFilterQuery<ReserveAccountFundsEntity> = {
      clientId: clientId,
      recordStatus: RecordStatus.Active,
    };
    const query = await this.entityManager
      .createQueryBuilder(this.entityName)
      .select(raw('SUM(amount) as total'))
      .where(where)
      .execute('all', false);
    const result = query[0] as any;
    const total = result?.total ?? 0;
    return parseInt(total);
  }
}
