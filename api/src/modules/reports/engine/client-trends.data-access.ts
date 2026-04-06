import {
  InvoiceEntitySchema,
  InvoiceStatus,
  RecordStatus,
  ReserveReason,
} from '@module-persistence/entities';
import { Repositories } from '@module-persistence/repositories';
import { Injectable } from '@nestjs/common';
import Big from 'big.js';
import { raw } from '@mikro-orm/postgresql';
import { ReportsDataAccess } from './reports.data-access';
import {
  DilutionStats,
  InvoiceARFeesDeductionsNfe,
  InvoicedAverages,
  InvoiceStats,
  PendingTotalsRow,
} from './data-access-types';
import { dilutionRatePercentage } from '@core/formulas';

@Injectable()
export class ClientTrendsReportsDataAccess {
  constructor(
    private readonly repositories: Repositories,
    private readonly reportsDataAccess: ReportsDataAccess,
  ) {}

  async getInvoicedAverageFeesAndYield(
    start: Date,
    end: Date,
    clientId: string | null = null,
  ): Promise<InvoicedAverages> {
    const qb = this.repositories.invoice
      .readOnlyQueryBuilder('i')
      .select([
        raw(
          `AVG(i.${InvoiceEntitySchema.COLUMN_ACCOUNTS_RECEIVABLE_VALUE}) AS approved_ar_average`,
        ),
        raw(
          `SUM(i.${InvoiceEntitySchema.COLUMN_ACCOUNTS_RECEIVABLE_VALUE}) AS approved_ar`,
        ),
        raw(
          `SUM(i.${InvoiceEntitySchema.COLUMN_APPROVED_FACTOR_FEE}) AS approved_factor_fees`,
        ),
      ])
      .where({
        recordStatus: RecordStatus.Active,
        status: InvoiceStatus.Purchased,
        purchasedDate: { $gte: start, $lt: end },
        ...(clientId ? { clientId } : {}),
      });

    const rows = (await qb.execute('all', false)) as Array<{
      approved_ar_average?: string | number | null;
      approved_ar?: string | number | null;
      approved_factor_fees?: string | number | null;
    }>;

    const row = rows?.[0] ?? {};
    const approvedAr = new Big(row.approved_ar ?? 0);
    const avgAr = new Big(row.approved_ar_average ?? 0);
    const factorFees = new Big(row.approved_factor_fees ?? 0);

    const invoiced = new Big(approvedAr);
    const averageInvoice = new Big(avgAr);
    const yieldVal = invoiced.gt(0)
      ? factorFees.div(invoiced).times(100)
      : new Big(0);

    return { invoiced, averageInvoice, factorFees, yieldVal };
  }

  async getReservesUntilDate(
    date: Date,
    clientId: string | null = null,
  ): Promise<number> {
    const qb = this.repositories.reserve
      .readOnlyQueryBuilder('r')
      .select([raw('COALESCE(SUM(r.amount), 0) AS total')])
      .where({
        recordStatus: RecordStatus.Active,
        createdAt: clientId ? { $lte: date } : { $lt: date },
        ...(clientId ? { clientId } : {}),
      });

    const row = (await qb.execute('get', false)) as {
      total?: string | number | null;
    };

    return Number(row?.total ?? 0);
  }

  async getInvoiceARFeesDeductionsNfeAtDate(
    asOfDate: Date,
    clientId: string | null = null,
  ): Promise<InvoiceARFeesDeductionsNfe> {
    const pending = await this.getClientPendingInvoiceTotalsAfterDate(
      asOfDate,
      clientId,
    );

    if (clientId) {
      const row = pending.find((r) => r.clientId === clientId) ?? pending[0];

      const invoicesAR = row ? new Big(row.total) : new Big(0);
      const totalFactorFees = row ? new Big(row.feesTotal) : new Big(0);
      const totalDeductions = row
        ? new Big(row.deductionsTotal).plus(row.reserveFeesTotal)
        : new Big(0);
      const totalNfe = invoicesAR.minus(totalFactorFees).minus(totalDeductions);

      return { invoicesAR, totalFactorFees, totalDeductions, totalNfe };
    }

    const invoicesAR = pending.reduce(
      (acc, r) => acc.plus(r.total),
      new Big(0),
    );
    const totalFactorFees = pending.reduce(
      (acc, r) => acc.plus(r.feesTotal),
      new Big(0),
    );
    const totalDeductionsOnly = pending.reduce(
      (acc, r) => acc.plus(r.deductionsTotal),
      new Big(0),
    );
    const totalReserveFees = pending.reduce(
      (acc, r) => acc.plus(r.reserveFeesTotal),
      new Big(0),
    );
    const totalDeductions = totalDeductionsOnly.plus(totalReserveFees);
    const totalNfe = invoicesAR.minus(totalFactorFees).minus(totalDeductions);

    return { invoicesAR, totalFactorFees, totalDeductions, totalNfe };
  }

  async getDilutionStats(
    start: Date,
    end: Date,
    clientId: string | null = null,
  ): Promise<DilutionStats> {
    const clientIds = clientId ? [clientId] : undefined;
    const { aggregate: reserveAggregate, byClient: reservesByClient } =
      await this.reportsDataAccess.getReserveSumsBetweenRange(
        start,
        end,
        clientIds,
      );
    const { aggregate: invoiceAggregate, byClient: invoiceByClient } =
      await this.getInvoiceStatsBetweenRange(start, end, clientIds);

    const reserves = clientId
      ? reservesByClient.get(clientId) || []
      : reserveAggregate;
    const stats = clientId
      ? invoiceByClient.get(clientId) || this.getDefaultInvoiceStats()
      : invoiceAggregate;

    const { dilution, adjDilution } = this.calculateDilution(
      stats.totalAR,
      reserves,
    );

    return {
      dilution,
      adjDilution,
      daysToPay:
        stats.count > 0
          ? stats.daysToPayTotal.div(stats.count).round()
          : new Big(0),
      daysToPost:
        stats.count > 0
          ? stats.daysToPostTotal.div(stats.count).round()
          : new Big(0),
    };
  }

  private getDefaultInvoiceStats(): InvoiceStats {
    return {
      totalAR: new Big(0),
      daysToPayTotal: new Big(0),
      daysToPostTotal: new Big(0),
      count: 0,
    };
  }

  private async getInvoiceStatsBetweenRange(
    startDate: Date,
    endDate: Date,
    clientIds?: string[],
  ): Promise<{
    byClient: Map<string, InvoiceStats>;
    aggregate: InvoiceStats;
  }> {
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

  private aggregateInvoiceStats(rows: Array<Record<string, any>>): {
    byClient: Map<string, InvoiceStats>;
    aggregate: InvoiceStats;
  } {
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

  private calculateDilution(
    totalAmount: Big,
    reserves: Array<{ reason: ReserveReason; total: number }>,
  ): { dilution: Big; adjDilution: Big } {
    if (totalAmount.eq(0)) {
      return { dilution: new Big(0), adjDilution: new Big(0) };
    }

    const shortpaysAmount = this.reportsDataAccess
      .sumByReasons(reserves, [
        ReserveReason.NonPayment,
        ReserveReason.Shortpay,
      ])
      .abs();
    const additionalPaymentsPlusOverpay = this.reportsDataAccess
      .sumByReasons(reserves, [
        ReserveReason.AdditionalPayment,
        ReserveReason.Overpay,
      ])
      .abs();
    const balanceReductions = this.reportsDataAccess
      .sumByReasons(reserves, [
        ReserveReason.Chargeback,
        ReserveReason.DirectPaymentByClient,
      ])
      .abs();

    const dilution = dilutionRatePercentage(shortpaysAmount, totalAmount);
    const adjNumerator = shortpaysAmount
      .minus(additionalPaymentsPlusOverpay)
      .minus(balanceReductions);
    const adjDilution = adjNumerator.gt(0)
      ? dilutionRatePercentage(adjNumerator, totalAmount)
      : new Big(0);

    return { dilution, adjDilution };
  }

  private async getClientPendingInvoiceTotalsAfterDate(
    date: Date,
    clientId: string | null,
  ): Promise<PendingTotalsRow[]> {
    const qb = this.repositories.invoice
      .readOnlyQueryBuilder('i')
      .select([
        ...(clientId ? [] : [raw('i.client_id as "clientId"')]),
        raw(
          `SUM(i.${InvoiceEntitySchema.COLUMN_ACCOUNTS_RECEIVABLE_VALUE}) AS "total"`,
        ),
        raw(
          `SUM(i.${InvoiceEntitySchema.COLUMN_APPROVED_FACTOR_FEE}) AS "feesTotal"`,
        ),
        raw(
          `SUM(i.${InvoiceEntitySchema.COLUMN_DEDUCTION}) AS "deductionsTotal"`,
        ),
        raw(
          `SUM(i.${InvoiceEntitySchema.COLUMN_RESERVE_FEE}) AS "reserveFeesTotal"`,
        ),
      ])
      .where({
        recordStatus: RecordStatus.Active,
        status: InvoiceStatus.Purchased,
        purchasedDate: { $lte: date },
        $or: [{ paymentDate: { $eq: null } }, { paymentDate: { $gte: date } }],
        ...(clientId ? { clientId } : {}),
      });

    if (!clientId) qb.groupBy('i.client_id');

    const rawRows = (await qb.execute('all', false)) as Array<{
      clientId?: string;
      total?: string | number | null;
      feesTotal?: string | number | null;
      deductionsTotal?: string | number | null;
      reserveFeesTotal?: string | number | null;
    }>;

    const rows: PendingTotalsRow[] = rawRows.map((r) => ({
      clientId: r.clientId ?? (clientId as string),
      total: new Big(r.total ?? 0),
      feesTotal: new Big(r.feesTotal ?? 0),
      deductionsTotal: new Big(r.deductionsTotal ?? 0),
      reserveFeesTotal: new Big(r.reserveFeesTotal ?? 0),
    }));

    if (clientId && rows.length === 1 && !rows[0].clientId) {
      rows[0].clientId = clientId;
    }

    return rows;
  }
}
