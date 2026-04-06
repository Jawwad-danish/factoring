import { FilterOperator, SortingOrder } from '@core/data';
import { FindOptions, Loaded, ObjectQuery } from '@mikro-orm/core';
import { DatabaseService } from '@module-database';
import { ClientPaymentEntity } from '@module-persistence/entities';
import {
  QueryCriteriaConfiguration,
  QueryCriteriaRepository,
} from '@module-persistence/repositories';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ClientPaymentRepository extends QueryCriteriaRepository<ClientPaymentEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, ClientPaymentEntity);
  }

  protected getQueryCriteriaConfiguration(): QueryCriteriaConfiguration<ClientPaymentEntity> {
    return {
      sortableColumns: {
        createdAt: new Set([SortingOrder.ASC, SortingOrder.DESC]),
      },
      defaultSortableColumns: {
        createdAt: SortingOrder.DESC,
      },
      searchableColumns: {
        id: new Set([FilterOperator.EQ]),
      },
      pagination: {
        maxItemsPerPage: 100,
      },
    };
  }

  async assignBatchPaymentId(
    batchPaymentId: string,
    entity: ClientPaymentEntity,
  ) {
    this.assign(entity, {
      batchPayment: batchPaymentId,
    });
  }

  async assignAccountId(
    clientBankAccountId: string,
    entity: ClientPaymentEntity,
  ) {
    this.assign(entity, {
      clientBankAccountId: clientBankAccountId,
    });
  }

  findOne<P extends string = never>(
    where: ObjectQuery<ClientPaymentEntity>,
    options?: FindOptions<ClientPaymentEntity, P>,
  ): Promise<null | Loaded<ClientPaymentEntity, P>> {
    return this.repository.findOne(where, options);
  }
}
