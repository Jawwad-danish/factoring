import { EntityNotFoundError } from '@core/errors';
import {
  FilterQuery,
  FindOneOptions,
  LoadStrategy,
  ObjectQuery,
  QBFilterQuery,
  raw,
} from '@mikro-orm/core';
import {
  BrokerPaymentStatus,
  ClientPaymentStatus,
  DetectionInvoiceType,
  InvoiceEntity,
  InvoiceStatus,
  RecordStatus,
  TagDefinitionKey,
  VerificationStatus,
} from '@module-persistence/entities';
import { Inject, Injectable } from '@nestjs/common';

import { SortingOrder } from '@core/data';
import { AutoPath, Loaded } from '@mikro-orm/core/typings';
import { Field } from '@mikro-orm/postgresql';
import { CompleteInvoiceKpiResponse } from '@module-invoices';
import Big from 'big.js';
import dayjs from 'dayjs';
import { Paths } from '../../../core';
import { DatabaseService } from '../../database/database.service';
import {
  QueryCriteriaConfiguration,
  QueryCriteriaRepository,
} from './basic-repository';
import { ApprovedLoad } from '@fs-bobtail/factoring/data';

interface SimilarityOutput {
  similarity: Big;
  invoice: InvoiceEntity;
}

interface Stats {
  count: number;
  total: number;
}

interface GetStatsOptions {
  amountColumnForTotal?: string;
}

export interface InvoiceFetchOptions {
  includeAudit: boolean;
}

@Injectable()
export class InvoiceRepository extends QueryCriteriaRepository<InvoiceEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, InvoiceEntity);
  }

  protected getQueryCriteriaConfiguration(): QueryCriteriaConfiguration<InvoiceEntity> {
    return {
      sortableColumns: {
        createdAt: new Set([SortingOrder.ASC, SortingOrder.DESC]),
        rejectedDate: new Set([SortingOrder.ASC, SortingOrder.DESC]),
        purchasedDate: new Set([SortingOrder.ASC, SortingOrder.DESC]),
        value: new Set([SortingOrder.ASC, SortingOrder.DESC]),
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

  async getClientInvoiceUnderApprovedStatus(
    clientId: string,
  ): Promise<Loaded<InvoiceEntity, never> | null> {
    return await this.repository.findOne({
      clientId,
      status: InvoiceStatus.Purchased,
      brokerPaymentStatus: BrokerPaymentStatus.NotReceived,
      clientPaymentStatus: {
        $in: [
          ClientPaymentStatus.InProgress,
          ClientPaymentStatus.Completed,
          ClientPaymentStatus.Sent,
        ],
      },
      recordStatus: RecordStatus.Active,
    });
  }

  async getTotalInvoicesWithIssuesByClientId(clientId: string): Promise<Big> {
    const qb = this.entityManager.createQueryBuilder(InvoiceEntity, 'i');
    qb.select(raw('SUM(i.value) as total')).where({
      clientId,
      hasIssues: true,
    });

    const result = await qb.execute();
    return new Big(result[0]?.total || '0');
  }

  async getTotalPurchasedInvoicesByClientId(clientId: string): Promise<Big> {
    const qb = this.entityManager.createQueryBuilder(InvoiceEntity, 'i');
    qb.select(raw('SUM(i.accounts_receivable_value) as total')).where({
      clientId,
      status: InvoiceStatus.Purchased,
    });

    const result = await qb.execute();
    return new Big(result[0]?.total || '0');
  }

  async getTotalUnderReviewInvoicesByClientId(clientId: string): Promise<Big> {
    const qb = this.entityManager.createQueryBuilder(InvoiceEntity, 'i');
    qb.select(raw('SUM(i.value) as total')).where({
      clientId,
      status: InvoiceStatus.UnderReview,
    });

    const result = await qb.execute();
    return new Big(result[0]?.total || '0');
  }

  async getCompletedInvoiceKpisByClientId(
    clientId: string,
  ): Promise<CompleteInvoiceKpiResponse> {
    const result = await this.execute(
      `
        SELECT
          SUM(CASE WHEN broker_payment_status = 'not_received' AND created_at >= NOW() - INTERVAL '30 days' THEN accounts_receivable_value ELSE 0 END) as "ar0to30",
          SUM(CASE WHEN broker_payment_status = 'not_received' AND created_at < NOW() - INTERVAL '30 days' AND created_at >= NOW() - INTERVAL '60 days' THEN accounts_receivable_value ELSE 0 END) as "ar30to60",
          SUM(CASE WHEN broker_payment_status = 'not_received' AND created_at < NOW() - INTERVAL '60 days' THEN accounts_receivable_value ELSE 0 END) as "arOver60",
          SUM(CASE WHEN broker_payment_status = 'not_received' THEN accounts_receivable_value ELSE 0 END) as "arTotal"
        FROM invoices
        WHERE client_id = ?
      `,
      [clientId],
    );

    return {
      accountsReceivable0to30: new Big(result[0]?.ar0to30 || '0'),
      accountsReceivable30to60: new Big(result[0]?.ar30to60 || '0'),
      accountsReceivableOver60: new Big(result[0]?.arOver60 || '0'),
      accountsReceivableTotal: new Big(result[0]?.arTotal || '0'),
    };
  }

  getDefaultPopulate(): AutoPath<InvoiceEntity, any>[] {
    const paths: Paths<InvoiceEntity>[] = [
      'createdBy',
      'updatedBy',
      'activities.createdBy',
      'brokerPayments',
      'buyout',
    ];
    return paths;
  }

  async getOneById(id: string): Promise<InvoiceEntity> {
    const invoice = await this.repository.findOne(
      {
        id: id,
        recordStatus: RecordStatus.Active,
      },
      {
        populate: [
          ...this.getDefaultPopulate(),
          'reserves.reserve',
          'invoiceClientPayments',
          'invoiceClientPayments.clientPayment',
        ],
      },
    );
    if (!invoice) {
      throw new EntityNotFoundError(`Could not find invoice by id ${id}`);
    }
    return invoice;
  }

  async getByBrokerPaymentId(id: string): Promise<InvoiceEntity> {
    const invoice = await this.repository.findOne(
      {
        brokerPayments: {
          id: id,
        },
      },
      {
        strategy: LoadStrategy.SELECT_IN,
        populate: this.getDefaultPopulate(),
      },
    );
    if (!invoice) {
      throw new EntityNotFoundError(
        `Could not find invoice by broker payment id ${id}`,
      );
    }

    return invoice;
  }

  async findOne(
    where: FilterQuery<InvoiceEntity>,
    options?: FindOneOptions<InvoiceEntity>,
  ) {
    return this.repository.findOne(where, options);
  }

  async anyMatchById(id: string): Promise<boolean> {
    const count = await this.repository.count({
      id,
      recordStatus: RecordStatus.Active,
    });
    return count != 0;
  }

  async getExplicitInvoiceFields(
    select: Field<InvoiceEntity>[],
    where: QBFilterQuery<InvoiceEntity>,
  ): Promise<Partial<InvoiceEntity>[]> {
    const result = await this.entityManager
      .createQueryBuilder(InvoiceEntity)
      .select(select)
      .where(where)
      .execute('all', true);
    if (result) {
      return result;
    }
    return [];
  }

  async findAllByHash(
    hashes: Array<string>,
    createdAt: Date,
    invoice: InvoiceEntity,
  ): Promise<DetectionInvoiceType[]> {
    let where: FilterQuery<InvoiceEntity> = {
      clientId: { $eq: invoice.clientId },
      brokerId: { $eq: invoice.brokerId },
      createdAt: { $gt: createdAt },
    };
    if (invoice.id) {
      where = {
        ...where,
        id: { $ne: invoice.id },
      };
    }
    const result = await this.entityManager
      .createQueryBuilder(InvoiceEntity)
      .select(['id', 'loadNumber', 'documents'])
      .leftJoinAndSelect(
        'documents',
        'd',
        {
          'd.file_hash': { $in: hashes },
        },
        ['id', 'fileHash', 'label'],
      )
      .where(where)
      .execute('all', true);
    return result ?? [];
  }

  async findSimilarByLoadNumber(options: {
    id?: string;
    loadNumber: string;
    clientId: string;
    similarityThreshold: Big;
    brokerId?: string | null;
  }): Promise<SimilarityOutput[]> {
    const whereClause: QBFilterQuery<InvoiceEntity> = {
      clientId: options.clientId,
      brokerId: options.brokerId,
    };
    if (options.id) {
      whereClause.id = {
        $ne: options.id,
      };
    }
    const queryBuilder = this.entityManager.createQueryBuilder(InvoiceEntity);
    const result = await queryBuilder
      .select([
        'id',
        'load_number',
        raw('word_similarity(load_number, ?)', [options.loadNumber]),
      ])
      .where(whereClause)
      .andWhere(
        raw(
          `word_similarity(load_number, ?) >= ${options.similarityThreshold.toNumber()}`,
          [options.loadNumber],
        ),
      )
      .execute('all', true);
    if (result == null) {
      return [];
    }
    return result.map((item) => {
      const similarity = new Big((item as any).word_similarity ?? 0);
      return {
        similarity,
        invoice: item,
      };
    });
  }

  async countByClient(
    clientId: string,
    options?: {
      status?: InvoiceStatus;
      verificationStatus?: VerificationStatus;
    },
  ): Promise<number> {
    const whereClause: FilterQuery<InvoiceEntity> = {
      clientId: clientId,
      recordStatus: RecordStatus.Active,
    };
    if (options?.status) {
      whereClause.status = options.status;
    }
    if (options?.verificationStatus) {
      whereClause.verificationStatus = options.verificationStatus;
    }
    return this.repository.count(whereClause);
  }

  async daysSinceFirstInvoiceByClient(clientId: string): Promise<number> {
    const queryResult = await this.entityManager
      .createQueryBuilder(this.entityName, 'i')
      .select(raw(`DATE_PART('day', now() - i.created_at) as days`))
      .where({
        clientId: clientId,
        recordStatus: RecordStatus.Active,
      })
      .orderBy({
        createdAt: 'ASC',
      })
      .limit(1, 0)
      .execute('all', false);
    const rawResult = queryResult[0] as any;
    return rawResult?.days ?? 0;
  }

  async totalAccountsReceivableByClient(clientId: string): Promise<number> {
    const queryResult = await this.entityManager
      .createQueryBuilder(this.entityName)
      .select(raw('SUM(accounts_receivable_value) as total'))
      .where({
        clientId,
        recordStatus: RecordStatus.Active,
        brokerPayments: {
          $ne: null,
        },
      })
      .execute('all', false);
    const rawResult = queryResult[0] as any;
    return Number(rawResult?.total) ?? 0;
  }

  async totalAccountsReceivableByBroker(brokerId: string): Promise<number> {
    const queryResult = await this.entityManager
      .createQueryBuilder(this.entityName)
      .select(raw('SUM(accounts_receivable_value) as total'))
      .where({
        brokerId,
        recordStatus: RecordStatus.Active,
        brokerPayments: {
          $ne: null,
        },
      })
      .execute('all', false);
    const rawResult = queryResult[0] as any;
    return Number(rawResult?.total) ?? 0;
  }

  async getTotalAmountUnpaidByBroker(brokerId: string): Promise<number> {
    const queryResult = await this.entityManager
      .createQueryBuilder(this.entityName)
      .select(raw('SUM(value) as total'))
      .where({
        brokerId,
        recordStatus: RecordStatus.Active,
        status: InvoiceStatus.Purchased,
        brokerPaymentStatus: BrokerPaymentStatus.NotReceived,
      })
      .execute('all', false);
    const rawResult = queryResult[0] as any;
    return Number(rawResult?.total) ?? 0;
  }

  async getLast30DaysTotalARUnpaidByClient(clientId: string): Promise<number> {
    const thirtyDaysAgo = dayjs().subtract(30, 'day').toDate();

    const queryResult = await this.entityManager
      .createQueryBuilder(this.entityName)
      .select(raw('SUM(accounts_receivable_value) as total'))
      .where({
        clientId,
        recordStatus: RecordStatus.Active,
        status: InvoiceStatus.Purchased,
        brokerPaymentStatus: BrokerPaymentStatus.NotReceived,
        purchasedDate: { $gt: thirtyDaysAgo },
      })
      .execute('all', false);
    const rawResult = queryResult[0] as any;
    return Number(rawResult?.total) ?? 0;
  }

  async getStats(
    query: ObjectQuery<InvoiceEntity>,
    options?: GetStatsOptions,
  ): Promise<Stats> {
    const amountColumn = options?.amountColumnForTotal || 'value';

    // If any of the query keys are a relation, we need to use a subquery to avoid
    // duplicated rows resulting from joins.
    const relations = this.getRelations();
    for (const key of Object.keys(query)) {
      if (relations.includes(key)) {
        return this.getStatsWithSubquery(query, options);
      }
    }

    // The end result is the same as with a subquery but the performance is better.
    const queryResult = await this.entityManager
      .createQueryBuilder(this.entityName, 'i')
      .select([
        raw(`SUM(i.${amountColumn}) as total`),
        raw(`COUNT(i.id) as count`),
      ])
      .where(query)
      .execute('all', false);

    const rawResult = queryResult[0] as any;
    return {
      count: Number(rawResult?.count) ?? 0,
      total: Number(rawResult?.total) ?? 0,
    };
  }

  private async getStatsWithSubquery(
    filters: ObjectQuery<InvoiceEntity>,
    options?: GetStatsOptions,
  ): Promise<Stats> {
    const amountColumn = options?.amountColumnForTotal || 'value';
    const subQuery = this.entityManager
      .createQueryBuilder(this.entityName, 'i')
      .select(['i.id', `${String(amountColumn)}`])
      .where(filters)
      .groupBy('i.id');

    const queryResult = await this.entityManager
      .createQueryBuilder(this.entityName)
      .select([
        raw(`SUM(subq.${amountColumn}) as total`),
        raw(`COUNT(subq.id) as count`),
      ])
      .from(subQuery, 'subq')
      .execute('all', false);

    const rawResult = queryResult[0] as any;
    return {
      count: Number(rawResult?.count) ?? 0,
      total: Number(rawResult?.total) ?? 0,
    };
  }

  // Upcoming chargebacks are an invoice that is >= 60 days outstanding
  async getChargebackStatsForClient(clientId: string): Promise<Stats> {
    const where: FilterQuery<InvoiceEntity> = {
      clientId,
      status: InvoiceStatus.Purchased,
      brokerPaymentStatus: {
        $nin: [
          BrokerPaymentStatus.ShortPaid,
          BrokerPaymentStatus.Overpaid,
          BrokerPaymentStatus.NonPayment,
          BrokerPaymentStatus.InFull,
        ],
      },
      purchasedDate: {
        $lt: raw(`NOW() - interval '60 days'`),
      },
    };
    return this.getStats(where);
  }

  async getPaperworkIssuesStatsForClient(clientId: string): Promise<Stats> {
    const paperworkIssuesTags: TagDefinitionKey[] = [
      TagDefinitionKey.UNREADABLE_DOCUMENT,
      TagDefinitionKey.MISSING_DOCUMENT,
    ];
    const brokerPaymentStatuses: BrokerPaymentStatus[] = [
      BrokerPaymentStatus.ShortPaid,
      BrokerPaymentStatus.Overpaid,
      BrokerPaymentStatus.NonPayment,
      BrokerPaymentStatus.InFull,
    ];
    const where: FilterQuery<InvoiceEntity> = {
      clientId,
      brokerPaymentStatus: {
        $nin: brokerPaymentStatuses,
      },
      status: InvoiceStatus.Purchased,
      recordStatus: RecordStatus.Active,
      tags: {
        tagDefinition: { key: { $in: paperworkIssuesTags } },
      },
    };

    return this.getStats(where);
  }

  async getOriginalsRequiredStatsByClient(clientId: string): Promise<Stats> {
    const where: FilterQuery<InvoiceEntity> = {
      clientId: clientId,
      status: InvoiceStatus.Purchased,
      tags: {
        tagDefinition: { key: TagDefinitionKey.MAIL_INVOICE_ORIGINAL },
      },
    };
    return this.getStats(where);
  }

  async firstPurchasedInvoiceDate(clientId: string): Promise<null | Date> {
    const result = await this.queryBuilder()
      .select('purchasedDate')
      .where({
        clientId,
        purchasedDate: {
          $ne: null,
        },
      })
      .orderBy({
        purchasedDate: 'ASC',
      })
      .limit(1)
      .execute('all');

    return result[0]?.purchasedDate || null;
  }

  async firstCreatedInvoiceDate(clientId: string): Promise<null | Date> {
    const result = await this.queryBuilder()
      .select('createdAt')
      .where({
        clientId,
      })
      .orderBy({
        createdAt: 'ASC',
      })
      .limit(1)
      .execute('all');

    return result[0]?.createdAt || null;
  }

  async findLast3ApprovedInvoicesByBroker(
    brokerId: string,
  ): Promise<ApprovedLoad[]> {
    const sixtyDaysAgo = dayjs().subtract(60, 'day').toDate();
    const result = await this.queryBuilder()
      .select(['id', 'loadNumber'])
      .where({
        brokerId,
        status: InvoiceStatus.Purchased,
        clientPaymentStatus: {
          $in: [ClientPaymentStatus.Sent, ClientPaymentStatus.Completed],
        },
        recordStatus: RecordStatus.Active,
        purchasedDate: {
          $gte: sixtyDaysAgo,
          $ne: null,
        },
      })
      .orderBy({
        purchasedDate: 'DESC',
      })
      .limit(3)
      .execute('all');

    return result.map((item) => ({
      id: item.id,
      loadNumber: item.loadNumber,
    }));
  }

  async findDistinctClientIdsByBroker(brokerId: string): Promise<string[]> {
    const sixMonthsAgo = dayjs().subtract(6, 'month').toDate();

    const result = await this.queryBuilder('i')
      .select(raw('DISTINCT i.client_id as client_id'))
      .where({
        brokerId,
        recordStatus: RecordStatus.Active,
        createdAt: { $gte: sixMonthsAgo },
      })
      .execute<{ client_id: string }[]>('all', false);

    return result.map((row) => row.client_id);
  }
}
