import { TimeRangeMetrics } from '@common/data';
import { endOfDay } from '@core/date-time';
import { dilutionRatePercentage } from '@core/formulas';
import { WrappedReadable } from '@core/util';
import { ObjectQuery, raw } from '@mikro-orm/postgresql';
import {
  BasicEntitySchema,
  BrokerPaymentStatus,
  ClientPaymentStatus,
  InvoiceEntity,
  InvoiceEntitySchema,
  InvoiceStatus,
  RecordStatus,
  ReserveEntity,
  ReserveReason,
} from '@module-persistence/entities';
import { Repositories } from '@module-persistence/repositories';
import { Injectable, Logger } from '@nestjs/common';
import Big from 'big.js';

import { QueryCriteria } from '../../../core/data';
import {
  ClientDilutionStats,
  ClientsAndBrokerIds,
  DaysToPayMetrics,
  DilutionRates,
  DilutionResult,
  InvoiceStats,
  InvoiceStatsByClient,
  RawApprovedAgingData,
  RawClientFactoringConfigWithTeam,
  RawClientNetFundsEmployedData,
  RawClientTotalReserve,
  RawDetailedAgingData,
  RawPortfolioClientsInvoiceAggRow,
  RawVolumeReportInvoiceData,
  ReserveSumsByClient,
} from './data-access-types';
import { createStreamWithErrorHandler } from './stream-error-handler.util';

@Injectable()
export class ReportsDataAccess {
  private readonly logger = new Logger(ReportsDataAccess.name);
  private readonly BATCH_QUERY_CHUNK_SIZE = 500;

  constructor(private readonly repositories: Repositories) {}

  private getDefaultInvoiceStats(): InvoiceStats {
    return {
      totalAR: new Big(0),
      daysToPayTotal: new Big(0),
      daysToPostTotal: new Big(0),
      count: 0,
    };
  }

  private aggregateInvoiceStats(
    rows: Array<Record<string, any>>,
  ): InvoiceStatsByClient {
    const byClient = new Map<string, InvoiceStats>();
    const aggregate = this.getDefaultInvoiceStats();

    for (const row of rows) {
      const clientId = row.clientId as string;
      const clientStats = {
        totalAR: new Big(row.totalAR || 0),
        daysToPayTotal: new Big(row.daysToPayTotal || 0),
        daysToPostTotal: new Big(row.daysToPostTotal || 0),
        count: Number(row.count || 0),
      };

      byClient.set(clientId, clientStats);

      aggregate.totalAR = aggregate.totalAR.plus(clientStats.totalAR);
      aggregate.daysToPayTotal = aggregate.daysToPayTotal.plus(
        clientStats.daysToPayTotal,
      );
      aggregate.daysToPostTotal = aggregate.daysToPostTotal.plus(
        clientStats.daysToPostTotal,
      );
      aggregate.count += clientStats.count;
    }

    return { byClient, aggregate };
  }

  async getPortfolioClientsInvoiceAgg(
    startDate: Date,
    endDate: Date,
  ): Promise<RawPortfolioClientsInvoiceAggRow[]> {
    return (await this.repositories.execute(
      `
        SELECT
          i.${InvoiceEntitySchema.COLUMN_CLIENT_ID},
          sd.start_date,
          SUM(i.${InvoiceEntitySchema.COLUMN_ACCOUNTS_RECEIVABLE_VALUE}) AS total_factor,
          SUM(i.${InvoiceEntitySchema.COLUMN_APPROVED_FACTOR_FEE}) AS total_fee
        FROM invoices i
        JOIN (
          SELECT
            ${InvoiceEntitySchema.COLUMN_CLIENT_ID},
            MIN(${BasicEntitySchema.COLUMN_CREATED_AT}) AS start_date
          FROM invoices
          WHERE ${InvoiceEntitySchema.COLUMN_RECORD_STATUS} = '${RecordStatus.Active}'
          GROUP BY ${InvoiceEntitySchema.COLUMN_CLIENT_ID}
        ) sd ON sd.${InvoiceEntitySchema.COLUMN_CLIENT_ID} = i.${InvoiceEntitySchema.COLUMN_CLIENT_ID}
        WHERE i.${InvoiceEntitySchema.COLUMN_RECORD_STATUS} = '${RecordStatus.Active}'
          AND i.${InvoiceEntitySchema.COLUMN_PURCHASED_DATE} >= ?
          AND i.${InvoiceEntitySchema.COLUMN_PURCHASED_DATE} <= ?
        GROUP BY i.${InvoiceEntitySchema.COLUMN_CLIENT_ID}, sd.start_date;
      `,
      [startDate, endDate],
    )) as RawPortfolioClientsInvoiceAggRow[];
  }

  async getClientTotalReserve(): Promise<
    WrappedReadable<RawClientTotalReserve>
  > {
    const query = this.repositories.reserve
      .readOnlyQueryBuilder('r')
      .select(['r.client_id', raw('SUM(r.amount) as total')])
      .groupBy('r.client_id');

    return new WrappedReadable(
      createStreamWithErrorHandler(query, 'getClientTotalReserve'),
    );
  }

  async getDetailedAging(
    date: Date,
  ): Promise<WrappedReadable<RawDetailedAgingData>> {
    const query = this.repositories.invoice
      .queryBuilder('i')
      .select([
        `i.${InvoiceEntitySchema.COLUMN_ID}`,
        `i.${InvoiceEntitySchema.COLUMN_ACCOUNTS_RECEIVABLE_VALUE}`,
        `i.${InvoiceEntitySchema.COLUMN_APPROVED_FACTOR_FEE}`,
        `i.${InvoiceEntitySchema.COLUMN_BROKER_ID}`,
        `i.${InvoiceEntitySchema.COLUMN_CLIENT_ID}`,
        `i.${InvoiceEntitySchema.COLUMN_DEDUCTION}`,
        `i.${InvoiceEntitySchema.COLUMN_LOAD_NUMBER}`,
        `i.${InvoiceEntitySchema.COLUMN_PURCHASED_DATE}`,
        `i.${InvoiceEntitySchema.COLUMN_RESERVE_FEE}`,
      ])
      .addSelect(
        raw(
          `(
            SELECT SUM(amount) FROM invoice_client_payments
            WHERE invoice_id = i.id
          ) as funded_amount`,
        ),
      )
      .where({
        purchasedDate: {
          $lte: endOfDay(date).toDate(),
        },
        status: InvoiceStatus.Purchased,
        recordStatus: RecordStatus.Active,
      })
      .andWhere(
        `(i.${InvoiceEntitySchema.COLUMN_PAYMENT_DATE} >= ? OR i.${InvoiceEntitySchema.COLUMN_PAYMENT_DATE} IS NULL)`,
        [endOfDay(date).toDate()],
      );

    return new WrappedReadable(
      createStreamWithErrorHandler(query, 'getDetailedAging'),
    );
  }

  async getApprovedAging(
    criteria?: QueryCriteria,
  ): Promise<WrappedReadable<RawApprovedAgingData>> {
    const query = this.repositories.invoice
      .readOnlyQueryBuilder('i')
      .select([
        `i.${InvoiceEntitySchema.COLUMN_CLIENT_ID}`,
        `i.${InvoiceEntitySchema.COLUMN_BROKER_ID}`,
        `i.${InvoiceEntitySchema.COLUMN_LOAD_NUMBER}`,
        `i.${InvoiceEntitySchema.COLUMN_ACCOUNTS_RECEIVABLE_VALUE}`,
        `i.${InvoiceEntitySchema.COLUMN_LINE_HAUL_RATE}`,
        `i.${BasicEntitySchema.COLUMN_CREATED_AT}`,
        `i.${InvoiceEntitySchema.COLUMN_DISPLAY_ID}`,
      ]);

    if (criteria) {
      const queryConstraints =
        await this.repositories.invoice.buildQueryConstraints(criteria);
      query.where(queryConstraints.whereClause);
      query.orderBy(queryConstraints.findOptions.orderBy || {});
    }

    this.logger.debug('Query: ', query.getKnexQuery().toString());

    return new WrappedReadable(
      createStreamWithErrorHandler(query, 'getApprovedAging'),
    );
  }

  async getReserveSumsBetweenRange(
    start: Date,
    end: Date,
    clientIds?: string[],
  ): Promise<ReserveSumsByClient> {
    const qb = this.repositories.reserve
      .readOnlyQueryBuilder('r')
      .select(['r.client_id', 'r.reason', raw('SUM(r.amount) AS total')])
      .where({
        recordStatus: RecordStatus.Active,
        createdAt: { $gte: start, $lte: end },
      });

    if (clientIds && clientIds.length > 0) {
      qb.andWhere({ clientId: { $in: clientIds } });
    } else if (clientIds && clientIds.length === 0) {
      return { byClient: new Map(), aggregate: [] };
    }

    qb.groupBy(['r.client_id', 'r.reason']);

    const rows = (await qb.execute('all', false)) as Array<{
      client_id: string;
      reason: ReserveReason;
      total: number;
    }>;

    const byClient = new Map<
      string,
      Array<{ reason: ReserveReason; total: number }>
    >();
    const aggregateMap = new Map<ReserveReason, number>();

    for (const row of rows) {
      if (!byClient.has(row.client_id)) {
        byClient.set(row.client_id, []);
      }
      const total = Number(row.total || 0);
      byClient.get(row.client_id)!.push({
        reason: row.reason,
        total,
      });

      aggregateMap.set(row.reason, (aggregateMap.get(row.reason) || 0) + total);
    }

    const aggregate = Array.from(aggregateMap.entries()).map(
      ([reason, total]) => ({ reason, total }),
    );

    return { byClient, aggregate };
  }

  async getClientsForFilter(
    criteria: ObjectQuery<InvoiceEntity>,
  ): Promise<string[]> {
    const clientQuery = this.repositories.invoice
      .readOnlyQueryBuilder()
      .select([raw('DISTINCT client_id')])
      .where(criteria);
    const clientResult = await clientQuery.execute('all', true);
    return clientResult.map((r) => r.clientId);
  }

  async getBrokersForFilter(
    criteria: ObjectQuery<InvoiceEntity>,
  ): Promise<string[]> {
    const brokerQuery = this.repositories.invoice
      .readOnlyQueryBuilder()
      .select([raw('DISTINCT broker_id')])
      .where(criteria);
    const brokerResult = await brokerQuery.execute('all', true);
    return brokerResult
      .map((r) => r.brokerId)
      .filter((id): id is string => id !== null);
  }

  async getClientsAndBrokersForFilter(
    criteria: QueryCriteria,
  ): Promise<ClientsAndBrokerIds> {
    const queryConstraints =
      await this.repositories.invoice.buildQueryConstraints(criteria);
    return {
      clientIds: await this.getClientsForFilter(queryConstraints.whereClause),
      brokerIds: await this.getBrokersForFilter(queryConstraints.whereClause),
    };
  }

  async getDilutionRatesByClientIds(
    startDate: Date,
    endDate: Date,
    clientIds: string[],
  ): Promise<Record<string, DilutionRates>> {
    const result: Record<string, { dilution: number; adjDilution: number }> =
      {};
    if (clientIds.length === 0) return result;

    for (const clientId of clientIds) {
      result[clientId] = { dilution: 0, adjDilution: 0 };
    }

    for (let i = 0; i < clientIds.length; i += this.BATCH_QUERY_CHUNK_SIZE) {
      const chunk = clientIds.slice(i, i + this.BATCH_QUERY_CHUNK_SIZE);

      const { byClient: reserveByClient } =
        await this.getReserveSumsBetweenRange(startDate, endDate, chunk);
      const { byClient: invoiceByClient } =
        await this.getInvoiceStatsBetweenRange(startDate, endDate, chunk);

      for (const clientId of chunk) {
        const stats =
          invoiceByClient.get(clientId) || this.getDefaultInvoiceStats();
        const reserves = reserveByClient.get(clientId) || [];

        const { dilution, adjDilution } = this.calculateDilution(
          stats.totalAR,
          reserves,
        );

        result[clientId] = {
          dilution: dilution.toNumber(),
          adjDilution: adjDilution.toNumber(),
        };
      }
    }

    return result;
  }

  private async getInvoiceStatsBetweenRange(
    startDate: Date,
    endDate: Date,
    clientIds?: string[],
  ): Promise<InvoiceStatsByClient> {
    if (clientIds?.length === 0) {
      return {
        byClient: new Map(),
        aggregate: this.getDefaultInvoiceStats(),
      };
    }

    let clientCondition = '';
    const params: any[] = [startDate, endDate];

    if (clientIds && clientIds.length > 0) {
      const placeholders = clientIds.map(() => '?').join(',');
      clientCondition = `AND i.client_id IN (${placeholders})`;
      params.push(...clientIds);
    }

    const rows = await this.repositories.execute(
      `
        SELECT
          i.client_id as "clientId",
          SUM(i.accounts_receivable_value) as "totalAR",
          SUM(CASE WHEN bp_first.amount > 0 AND i.purchased_date IS NOT NULL AND i.payment_date IS NOT NULL
                   THEN FLOOR(EXTRACT(EPOCH FROM (i.payment_date - i.purchased_date)) / 86400) ELSE 0 END) as "daysToPostTotal",
          SUM(CASE WHEN bp_first.amount > 0 AND i.purchased_date IS NOT NULL AND bp_first.batch_date IS NOT NULL
                   THEN FLOOR(EXTRACT(EPOCH FROM (bp_first.batch_date - i.purchased_date)) / 86400) ELSE 0 END) as "daysToPayTotal",
          SUM(CASE WHEN bp_first.amount > 0 AND i.purchased_date IS NOT NULL THEN 1 ELSE 0 END) as "count"
        FROM invoices i
        LEFT JOIN LATERAL (
          SELECT bp.amount, bp.batch_date
          FROM broker_payments bp
          WHERE bp.invoice_id = i.id AND bp.record_status = '${RecordStatus.Active}'
          ORDER BY bp.created_at ASC
          LIMIT 1
        ) bp_first ON true
        WHERE i.record_status = '${RecordStatus.Active}'
          AND i.payment_date >= ?
          AND i.payment_date <= ?
          ${clientCondition}
        GROUP BY i.client_id
      `,
      params,
    );

    return this.aggregateInvoiceStats(rows);
  }

  private calculateDilution(
    totalAmount: Big,
    reserves: Array<{ reason: ReserveReason; total: number }>,
  ): DilutionResult {
    if (totalAmount.eq(0)) {
      return { dilution: new Big(0), adjDilution: new Big(0) };
    }

    const shortpaysAmount = this.sumByReasons(reserves, [
      ReserveReason.NonPayment,
      ReserveReason.Shortpay,
    ]).abs();
    const additionalPaymentsPlusOverpay = this.sumByReasons(reserves, [
      ReserveReason.AdditionalPayment,
      ReserveReason.Overpay,
    ]).abs();
    const balanceReductions = this.sumByReasons(reserves, [
      ReserveReason.Chargeback,
      ReserveReason.DirectPaymentByClient,
    ]).abs();

    const dilution = dilutionRatePercentage(shortpaysAmount, totalAmount);
    const adjNumerator = shortpaysAmount
      .minus(additionalPaymentsPlusOverpay)
      .minus(balanceReductions);
    const adjDilution = adjNumerator.gt(0)
      ? dilutionRatePercentage(adjNumerator, totalAmount)
      : new Big(0);

    return { dilution, adjDilution };
  }

  async resolveDilutionStatsBetweenRange(
    clientIds: string[],
    reserves: ReserveEntity[],
    startDate: Date,
    endDate: Date,
  ): Promise<Map<string, ClientDilutionStats>> {
    const dilutions = new Map<string, ClientDilutionStats>();

    const { byClient: invoiceByClient } =
      await this.getInvoiceStatsBetweenRange(startDate, endDate, clientIds);

    for (const clientId of clientIds) {
      const clientReserves = reserves
        .filter((r) => r['client_id'] === clientId)
        .map((r) => ({ reason: r.reason, total: Number(r['total']) }));

      const stats = invoiceByClient.get(clientId) || {
        totalAR: new Big(0),
        daysToPayTotal: new Big(0),
        count: 0,
      };

      const { dilution, adjDilution } = this.calculateDilution(
        stats.totalAR,
        clientReserves,
      );

      dilutions.set(clientId, {
        dilution,
        adjDilution,
        daysToPay:
          stats.count > 0 ? stats.daysToPayTotal.div(stats.count) : new Big(0),
      });
    }
    return dilutions;
  }

  async getDaysToPayAverageMetricsByPaymentDate(
    brokerIds: string[],
  ): Promise<DaysToPayMetrics[]> {
    const queryBuilder = this.repositories.invoice.queryBuilder('i');
    const result = await queryBuilder
      .select(
        raw(
          `i.broker_id,
         AVG(CASE
           WHEN i.payment_date >= NOW() - INTERVAL '30 days'
             AND i.purchased_date IS NOT NULL
             AND i.payment_date IS NOT NULL
             AND EXTRACT(EPOCH FROM (i.payment_date - i.purchased_date)) / 86400 >= 0
           THEN EXTRACT(EPOCH FROM (i.payment_date - i.purchased_date)) / 86400
           ELSE NULL
         END) as last30days,
         AVG(CASE
           WHEN i.payment_date >= NOW() - INTERVAL '60 days'
             AND i.purchased_date IS NOT NULL
             AND i.payment_date IS NOT NULL
             AND EXTRACT(EPOCH FROM (i.payment_date - i.purchased_date)) / 86400 >= 0
           THEN EXTRACT(EPOCH FROM (i.payment_date - i.purchased_date)) / 86400
           ELSE NULL
         END) as last60days,
         AVG(CASE
           WHEN i.payment_date >= NOW() - INTERVAL '90 days'
             AND i.purchased_date IS NOT NULL
             AND i.payment_date IS NOT NULL
             AND EXTRACT(EPOCH FROM (i.payment_date - i.purchased_date)) / 86400 >= 0
           THEN EXTRACT(EPOCH FROM (i.payment_date - i.purchased_date)) / 86400
           ELSE NULL
         END) as last90days`,
        ),
      )
      .where({
        brokerId: { $in: brokerIds },
        status: InvoiceStatus.Purchased,
        purchasedDate: {
          $ne: null,
        },
        paymentDate: {
          $ne: null,
        },
        recordStatus: RecordStatus.Active,
      })
      .groupBy('i.broker_id')
      .execute('all', false);

    return result.map((r) => ({
      brokerId: r['broker_id'],
      metrics: new TimeRangeMetrics({
        last30Days: new Big(r['last30days'] || 0),
        last60Days: new Big(r['last60days'] || 0),
        last90Days: new Big(r['last90days'] || 0),
      }),
    }));
  }

  sumByReasons(
    reserves: Array<{ reason: ReserveReason; [key: string]: any }>,
    reasons: ReserveReason[],
  ): Big {
    return reasons.reduce(
      (acc, reason) =>
        acc.add(
          new Big(reserves.find((r) => r.reason === reason)?.['total'] || 0),
        ),
      new Big(0),
    );
  }

  async getClientAgingByData(
    invoicesPurchasedBy: Date,
  ): Promise<WrappedReadable<RawClientNetFundsEmployedData>> {
    const query = this.repositories.invoice
      .readOnlyQueryBuilder('i')
      .select([
        'i.client_id',
        raw(
          `SUM(case when i.${InvoiceEntitySchema.COLUMN_CREATED_AT} >= NOW() - interval '30 days' then i.${InvoiceEntitySchema.COLUMN_ACCOUNTS_RECEIVABLE_VALUE} else 0 end) as days_0_to_30,
          SUM(case when i.${InvoiceEntitySchema.COLUMN_CREATED_AT} < NOW() - interval '30 days' AND i.${InvoiceEntitySchema.COLUMN_CREATED_AT} >= NOW() - interval '60 days' then i.${InvoiceEntitySchema.COLUMN_ACCOUNTS_RECEIVABLE_VALUE} else 0 end) as days_31_to_60,
          SUM(case when i.${InvoiceEntitySchema.COLUMN_CREATED_AT} < NOW() - interval '60 days' AND i.${InvoiceEntitySchema.COLUMN_CREATED_AT} >= NOW() - interval '90 days' then i.${InvoiceEntitySchema.COLUMN_ACCOUNTS_RECEIVABLE_VALUE} else 0 end) as days_61_to_90,
          SUM(case when i.${InvoiceEntitySchema.COLUMN_CREATED_AT} < NOW() - interval '90 days' then i.${InvoiceEntitySchema.COLUMN_ACCOUNTS_RECEIVABLE_VALUE} else 0 end) as days_91_plus,
          SUM(i.${InvoiceEntitySchema.COLUMN_ACCOUNTS_RECEIVABLE_VALUE}) as ar_total,
          SUM(i.${InvoiceEntitySchema.COLUMN_RESERVE_FEE}) as reserve_fees_total,
          SUM(i.${InvoiceEntitySchema.COLUMN_DEDUCTION}) as deduction_total,
          SUM(i.${InvoiceEntitySchema.COLUMN_APPROVED_FACTOR_FEE}) as factor_fees_total`,
        ),
      ])
      .where({
        recordStatus: RecordStatus.Active,
        status: InvoiceStatus.Purchased,
        clientPaymentStatus: [
          ClientPaymentStatus.Sent,
          ClientPaymentStatus.Completed,
        ],
        brokerPaymentStatus: BrokerPaymentStatus.NotReceived,
        purchasedDate: { $lte: invoicesPurchasedBy },
      })
      .groupBy('i.client_id');

    return new WrappedReadable(
      createStreamWithErrorHandler(query, 'getNetFundsEmployedDataByClient'),
    );
  }

  async getAllClientFactoringConfigsWithTeamDataStream(): Promise<
    WrappedReadable<RawClientFactoringConfigWithTeam>
  > {
    const query = this.repositories.clientFactoringConfig
      .readOnlyQueryBuilder('cfc')
      .select([
        'cfc.client_id',
        raw(
          `cst.name as client_success_team_name,
        u.first_name as sales_rep_first_name,
        u.last_name as sales_rep_last_name`,
        ),
      ])
      .leftJoin('cfc.clientSuccessTeam', 'cst')
      .leftJoin('cfc.salesRep', 'e')
      .leftJoin('e.user', 'u');

    return new WrappedReadable(
      createStreamWithErrorHandler(
        query,
        'getAllClientFactoringConfigsWithTeamDataStream',
      ),
    );
  }

  async getVolumeReportInvoiceData(
    startDate: Date,
    endDate: Date,
  ): Promise<Map<string, RawVolumeReportInvoiceData>> {
    const query = this.repositories.invoice
      .readOnlyQueryBuilder('i')
      .select([
        'i.client_id',
        raw(
          `SUM(i.${InvoiceEntitySchema.COLUMN_ACCOUNTS_RECEIVABLE_VALUE}) as ar_total,
        SUM(i.${InvoiceEntitySchema.COLUMN_APPROVED_FACTOR_FEE}) as factor_fees_total`,
        ),
      ])
      .where({
        recordStatus: RecordStatus.Active,
        status: InvoiceStatus.Purchased,
        purchasedDate: { $gte: startDate, $lte: endDate },
      })
      .groupBy('i.client_id');

    const results = await query.execute();

    const invoiceMap = new Map<string, RawVolumeReportInvoiceData>();
    results.forEach((row: any) => {
      invoiceMap.set(row.clientId, {
        client_id: row.clientId,
        ar_total: row.ar_total,
        factor_fees_total: row.factor_fees_total,
      });
    });
    return invoiceMap;
  }
}
