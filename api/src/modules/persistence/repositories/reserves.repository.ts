import { FilterOperator, SortingOrder } from '@core/data';
import {
  FindOptions,
  Loaded,
  ObjectQuery,
  QBFilterQuery,
  raw,
} from '@mikro-orm/core';
import { DatabaseService } from '@module-database';
import {
  RecordStatus,
  ReserveEntity,
  ReserveReason,
} from '@module-persistence/entities';
import { Inject, Injectable } from '@nestjs/common';
import { Big } from 'big.js';
import {
  QueryCriteriaConfiguration,
  QueryCriteriaRepository,
} from './basic-repository';

type WriteOffReserveStatus = {
  reason: ReserveReason.WriteOff | ReserveReason.WriteOffRemoved;
  count: number;
};

@Injectable()
export class ReserveRepository extends QueryCriteriaRepository<ReserveEntity> {
  protected getQueryCriteriaConfiguration(): QueryCriteriaConfiguration<ReserveEntity> {
    return {
      sortableColumns: {
        createdAt: new Set([SortingOrder.ASC, SortingOrder.DESC]),
      },
      defaultSortableColumns: {
        createdAt: SortingOrder.DESC,
      },
      searchableColumns: {
        id: new Set([FilterOperator.EQ]),
        reason: new Set([FilterOperator.EQ]),
        clientId: new Set([FilterOperator.EQ]),
      },
      pagination: {
        maxItemsPerPage: 100,
      },
    };
  }
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, ReserveEntity);
  }

  async getTotalByClient(
    clientId: string,
    options?: {
      from?: Date;
      to?: Date;
    },
  ): Promise<number> {
    const where: QBFilterQuery<ReserveEntity> = {
      clientId: clientId,
      recordStatus: RecordStatus.Active,
    };

    if (options) {
      const createdAtFilter = {};
      if (options.from) {
        Object.assign(createdAtFilter, { $lte: options.from });
      }
      if (options.to) {
        Object.assign(createdAtFilter, { $gte: options.to });
      }
      where['createdAt'] = createdAtFilter;
    }
    const query = await this.entityManager
      .createQueryBuilder(this.entityName)
      .select(raw('SUM(amount) as total'))
      .where(where)
      .execute('all', false);
    const result = query[0] as any;
    const total = result?.total ?? 0;
    return parseInt(total);
  }

  findOne<P extends string = never>(
    where: ObjectQuery<ReserveEntity>,
    options?: FindOptions<ReserveEntity, P>,
  ): Promise<null | Loaded<ReserveEntity, P>> {
    return this.repository.findOne(where, options);
  }

  async getClientsByBalance(filter: {
    lte?: Big;
    gte?: Big;
  }): Promise<string[]> {
    const havingCondition: QBFilterQuery<ReserveEntity> = {};

    if (filter) {
      const totalFilter = {};

      if (filter.lte) {
        Object.assign(totalFilter, { $lte: filter.lte });
      }

      if (filter.gte) {
        Object.assign(totalFilter, { $gte: filter.gte });
      }

      havingCondition[raw('SUM(amount)')] = totalFilter;
    }

    const query = await this.entityManager
      .createQueryBuilder(this.entityName)
      .select(raw('client_id'), true)
      .groupBy('client_id')
      .having(havingCondition)
      .execute('all', true);

    return query.map((reserve) => reserve.clientId);
  }

  async getWriteOffReserveStatus(
    clientId: string,
  ): Promise<WriteOffReserveStatus[]> {
    const query = await this.entityManager
      .createQueryBuilder(this.entityName)
      .select(['reason', raw('COUNT(*) as count')])
      .where({
        clientId,
        reason: {
          $in: [ReserveReason.WriteOff, ReserveReason.WriteOffRemoved],
        },
      })
      .groupBy('reason')
      .execute();

    return query as unknown as WriteOffReserveStatus[];
  }

  async getRecentChargebacks(
    clientId: string,
    days: number,
  ): Promise<ReserveEntity[]> {
    const reserves = await this.repository.findAll({
      where: {
        clientId,
        reason: [ReserveReason.Chargeback, ReserveReason.ChargebackRemoved],
        createdAt: {
          $gte: raw(`NOW() - INTERVAL '${days} days'`),
        },
      },
      orderBy: {
        createdAt: 'DESC',
      },
    });
    return reserves;
  }
}
