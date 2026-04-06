import { FilterOperator, SortingOrder } from '@core/data';
import { DatabaseService } from '@module-database';
import { ProcessingNotesEntity } from '@module-persistence/entities';
import { Inject, Injectable } from '@nestjs/common';
import {
  QueryCriteriaConfiguration,
  QueryCriteriaRepository,
} from './basic-repository';

@Injectable()
export class ProcessingNotesRepository extends QueryCriteriaRepository<ProcessingNotesEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, ProcessingNotesEntity);
  }

  protected getQueryCriteriaConfiguration(): QueryCriteriaConfiguration<ProcessingNotesEntity> {
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
        brokerId: new Set([FilterOperator.EQ]),
        status: new Set([FilterOperator.EQ]),
      },
      pagination: {
        maxItemsPerPage: 100,
      },
    };
  }
}
