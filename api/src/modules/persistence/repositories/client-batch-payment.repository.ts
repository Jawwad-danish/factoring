import { SortingOrder } from '@core/data';
import { Paths } from '@core/types';
import { FindOptions, Loaded, ObjectQuery } from '@mikro-orm/core';
import { DatabaseService } from '@module-database';
import { ClientBatchPaymentEntity } from '@module-persistence/entities';
import {
  QueryCriteriaConfiguration,
  QueryCriteriaRepository,
} from '@module-persistence/repositories';
import { Inject, Injectable } from '@nestjs/common';

interface ClientBatchPaymentEntityFindOptions {
  audit: boolean;
  clientPayments: boolean;
}
@Injectable()
export class ClientBatchPaymentRepository extends QueryCriteriaRepository<ClientBatchPaymentEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, ClientBatchPaymentEntity);
  }

  protected getQueryCriteriaConfiguration(): QueryCriteriaConfiguration<ClientBatchPaymentEntity> {
    return {
      sortableColumns: {
        createdAt: new Set([SortingOrder.ASC, SortingOrder.DESC]),
      },
      defaultSortableColumns: {
        createdAt: SortingOrder.DESC,
      },
      searchableColumns: {},
      pagination: {
        maxItemsPerPage: 100,
      },
    };
  }

  async findOneByName(
    name: string,
    options?: ClientBatchPaymentEntityFindOptions,
  ): Promise<ClientBatchPaymentEntity | null> {
    return this.repository.findOne(
      { name: name },
      this.buildFindOptions(options),
    );
  }

  async findOne<P extends string = never>(
    where: ObjectQuery<ClientBatchPaymentEntity>,
    options?: FindOptions<ClientBatchPaymentEntity, P>,
  ): Promise<null | Loaded<ClientBatchPaymentEntity, P>> {
    return this.repository.findOne(where, options);
  }

  private buildFindOptions(
    options?: ClientBatchPaymentEntityFindOptions,
  ): FindOptions<ClientBatchPaymentEntity, any> {
    const populate: Paths<ClientBatchPaymentEntity>[] = [];
    if (options?.clientPayments) {
      populate.push('clientPayments');
      if (options?.audit) {
        populate.push('clientPayments.createdBy', 'clientPayments.updatedBy');
      }
    }
    if (options?.audit) {
      populate.push('createdBy', 'updatedBy');
    }
    return {
      populate,
    };
  }
}
