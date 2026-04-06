import { FilterOperator, SortingOrder } from '@core/data';
import { DatabaseService } from '@module-database';
import { Inject, Injectable } from '@nestjs/common';
import { PendingBuyoutEntity } from '../entities/pending-buyout.entity';
import {
  QueryCriteriaConfiguration,
  QueryCriteriaRepository,
} from './basic-repository';

import { EntityNotFoundError } from '@core/errors';
import { RecordStatus } from '@module-persistence/entities';

@Injectable()
export class PendingBuyoutRepository extends QueryCriteriaRepository<PendingBuyoutEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, PendingBuyoutEntity);
  }

  protected getQueryCriteriaConfiguration(): QueryCriteriaConfiguration<PendingBuyoutEntity> {
    return {
      sortableColumns: {
        createdAt: new Set([SortingOrder.ASC, SortingOrder.DESC]),
      },
      defaultSortableColumns: {
        createdAt: SortingOrder.DESC,
      },
      searchableColumns: {
        id: new Set([FilterOperator.IN, FilterOperator.EQ]),
      },
      pagination: {
        maxItemsPerPage: 100,
      },
    };
  }

  async getOneById(id: string): Promise<PendingBuyoutEntity> {
    const buyout = await this.repository.findOne({
      id: id,
      recordStatus: RecordStatus.Active,
    });
    if (!buyout) {
      throw EntityNotFoundError.byId(id, 'buyout');
    }
    return buyout;
  }
}
