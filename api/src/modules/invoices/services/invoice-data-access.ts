import { TimeRangeMetrics } from '@common/data';
import { dilutionRatePercentage } from '@core/formulas';
import { ObjectQuery, raw } from '@mikro-orm/core';
import { ChargebackReserve } from '@module-clients/data';
import {
  BrokerPaymentStatus,
  InvoiceEntity,
  InvoiceEntitySchema,
  InvoiceStatus,
  RecordStatus,
} from '@module-persistence/entities';
import { Repositories } from '@module-persistence/repositories';
import { Injectable } from '@nestjs/common';
import Big from 'big.js';
import { InvoiceVolumeStats } from '../data';

@Injectable()
export class InvoiceDataAccess {
  constructor(private readonly repositories: Repositories) {}

  async getDilutionRate(clientId: string): Promise<Big> {
    const queryResult = await this.repositories.execute(
      `select
        sum(i.accounts_receivable_value) - sum(bp.amount) as "leftToPay"
      from
        invoices i
      left join broker_payments bp on bp.invoice_id = i.id
      where
        i.record_status = '${RecordStatus.Active}'
        and i.broker_payment_status in ('${BrokerPaymentStatus.ShortPaid}', '${BrokerPaymentStatus.NonPayment}')
        and i.client_id = ?
        and bp.record_status = '${RecordStatus.Active}';`,
      [clientId],
    );
    const rawResult = queryResult[0] as any;
    const leftToPayAmount = Number(rawResult?.leftToPay ?? 0);
    if (leftToPayAmount == 0) {
      return new Big(0);
    }

    const totalAmount =
      await this.repositories.invoice.totalAccountsReceivableByClient(clientId);
    if (totalAmount === 0) {
      return new Big(99);
    }
    return dilutionRatePercentage(leftToPayAmount, totalAmount);
  }

  async getClientDilutionRateMetrics(
    clientId: string,
  ): Promise<TimeRangeMetrics> {
    const totalAccountsReceivableAmount =
      await this.repositories.invoice.totalAccountsReceivableByClient(clientId);
    if (totalAccountsReceivableAmount === 0) {
      return new TimeRangeMetrics({
        last30Days: new Big(99),
        last60Days: new Big(99),
        last90Days: new Big(99),
      });
    }

    const leftToPayAmountMetrics = await this.leftToPayAmountMetrics({
      clientId,
    });
    return new TimeRangeMetrics({
      last30Days: dilutionRatePercentage(
        leftToPayAmountMetrics.last30Days,
        totalAccountsReceivableAmount,
      ),
      last60Days: dilutionRatePercentage(
        leftToPayAmountMetrics.last60Days,
        totalAccountsReceivableAmount,
      ),
      last90Days: dilutionRatePercentage(
        leftToPayAmountMetrics.last90Days,
        totalAccountsReceivableAmount,
      ),
    });
  }

  async getBrokerDilutionRateMetrics(
    brokerId: string,
  ): Promise<TimeRangeMetrics> {
    const totalAmount =
      await this.repositories.invoice.totalAccountsReceivableByBroker(brokerId);
    if (totalAmount === 0) {
      return {
        last30Days: new Big(99),
        last60Days: new Big(99),
        last90Days: new Big(99),
      };
    }
    const leftToPayAmountMetrics = await this.leftToPayAmountMetrics({
      brokerId,
    });

    return new TimeRangeMetrics({
      last30Days: dilutionRatePercentage(
        leftToPayAmountMetrics.last30Days,
        totalAmount,
      ),
      last60Days: dilutionRatePercentage(
        leftToPayAmountMetrics.last60Days,
        totalAmount,
      ),
      last90Days: dilutionRatePercentage(
        leftToPayAmountMetrics.last90Days,
        totalAmount,
      ),
    });
  }

  private async leftToPayAmountMetrics({
    clientId,
    brokerId,
  }: {
    clientId?: string;
    brokerId?: string;
  }): Promise<TimeRangeMetrics> {
    const brokerPaymentsSUM = await this.repositories.brokerPayment
      .queryBuilder('bp')
      .select(
        raw(
          `SUM(CASE WHEN bp.created_at >= NOW() - INTERVAL '30 days' THEN bp.amount ELSE 0 END) AS last30days,
      SUM(CASE WHEN bp.created_at >= NOW() - INTERVAL '60 days' THEN bp.amount ELSE 0 END) AS last60days,
      SUM(CASE WHEN bp.created_at >= NOW() - INTERVAL '90 days' THEN bp.amount ELSE 0 END) AS last90days`,
        ),
      )
      .where({
        recordStatus: RecordStatus.Active,
        invoice: {
          clientId,
          brokerId,
          brokerPaymentStatus: BrokerPaymentStatus.ShortPaid,
          recordStatus: RecordStatus.Active,
        },
      })
      .execute('all', false);
    const brokerPaymentsResult = brokerPaymentsSUM[0] as any;

    const invoicesSUM = await this.repositories.invoice
      .queryBuilder('i')
      .select(
        raw(
          `SUM(case when i.created_at >= NOW() - interval '30 days' then i.accounts_receivable_value else 0 end) as last30days,
	SUM(case when i.created_at >= NOW() - interval '60 days' then i.accounts_receivable_value else 0 end) as last60days,
	SUM(case when i.created_at >= NOW() - interval '90 days' then i.accounts_receivable_value else 0 end) as last90days`,
        ),
      )
      .where({
        recordStatus: RecordStatus.Active,
        clientId,
        brokerPaymentStatus: [
          BrokerPaymentStatus.ShortPaid,
          BrokerPaymentStatus.NonPayment,
        ],
      })
      .execute('all', false);
    const invoicesResult = invoicesSUM[0] as any;

    return new TimeRangeMetrics({
      last30Days: new Big(invoicesResult?.last30days || 0).minus(
        new Big(brokerPaymentsResult?.last30days || 0),
      ),
      last60Days: new Big(invoicesResult?.last60days || 0).minus(
        new Big(brokerPaymentsResult?.last60days || 0),
      ),
      last90Days: new Big(invoicesResult?.last90days || 0).minus(
        new Big(brokerPaymentsResult?.last90days || 0),
      ),
    });
  }

  async getClientTotalBrokersMetrics(
    clientId: string,
  ): Promise<TimeRangeMetrics> {
    const queryBuilder = this.repositories.invoice.queryBuilder('i');
    const result = await queryBuilder
      .select(
        raw(
          `COUNT(DISTINCT CASE WHEN i.created_at >= NOW() - INTERVAL '30 days' THEN i.broker_id ELSE NULL END) as last30days,
        COUNT(DISTINCT CASE WHEN i.created_at >= NOW() - INTERVAL '60 days' THEN i.broker_id ELSE NULL END) as last60days,
        COUNT(DISTINCT CASE WHEN i.created_at >= NOW() - INTERVAL '90 days' THEN i.broker_id ELSE NULL END) as last90days`,
        ),
      )
      .where({
        clientId,
        recordStatus: RecordStatus.Active,
      })
      .execute('all', false);
    const rawResult = result[0] as any;

    return new TimeRangeMetrics({
      last30Days: new Big(rawResult?.last30days || 0),
      last60Days: new Big(rawResult?.last60days || 0),
      last90Days: new Big(rawResult?.last90days || 0),
    });
  }

  async getClientDaysToPayAverageMetrics(
    clientId: string,
  ): Promise<TimeRangeMetrics> {
    const queryBuilder = this.repositories.invoice.queryBuilder('i');
    const result = await queryBuilder
      .select(
        raw(
          `AVG(CASE WHEN i.created_at >= NOW() - INTERVAL '30 days' THEN EXTRACT(EPOCH FROM (i.payment_date - i.purchased_date)) / 86400 ELSE NULL END) as last30days,
         AVG(CASE WHEN i.created_at >= NOW() - INTERVAL '60 days' THEN EXTRACT(EPOCH FROM (i.payment_date - i.purchased_date)) / 86400 ELSE NULL END) as last60days,
         AVG(CASE WHEN i.created_at >= NOW() - INTERVAL '90 days' THEN EXTRACT(EPOCH FROM (i.payment_date - i.purchased_date)) / 86400 ELSE NULL END) as last90days`,
        ),
      )
      .where({
        clientId,
        brokerId: {
          $ne: null,
        },
        status: InvoiceStatus.Purchased,
        purchasedDate: {
          $ne: null,
        },
        paymentDate: {
          $ne: null,
        },
        recordStatus: RecordStatus.Active,
      })
      .execute('all', false);
    const rawResult = result[0] as any;

    return new TimeRangeMetrics({
      last30Days: new Big(rawResult?.last30days || 0),
      last60Days: new Big(rawResult?.last60days || 0),
      last90Days: new Big(rawResult?.last90days || 0),
    });
  }

  async getBrokerDaysToPayAverageMetrics(
    brokerId: string,
  ): Promise<TimeRangeMetrics> {
    const queryBuilder = this.repositories.invoice.queryBuilder('i');
    const result = await queryBuilder
      .select(
        raw(
          `AVG(CASE WHEN i.created_at >= NOW() - INTERVAL '30 days' THEN EXTRACT(EPOCH FROM (i.payment_date - i.purchased_date)) / 86400 ELSE NULL END) as last30days,
         AVG(CASE WHEN i.created_at >= NOW() - INTERVAL '60 days' THEN EXTRACT(EPOCH FROM (i.payment_date - i.purchased_date)) / 86400 ELSE NULL END) as last60days,
         AVG(CASE WHEN i.created_at >= NOW() - INTERVAL '90 days' THEN EXTRACT(EPOCH FROM (i.payment_date - i.purchased_date)) / 86400 ELSE NULL END) as last90days`,
        ),
      )
      .where({
        brokerId,
        status: InvoiceStatus.Purchased,
        purchasedDate: {
          $ne: null,
        },
        paymentDate: {
          $ne: null,
        },
        recordStatus: RecordStatus.Active,
      })
      .execute('all', false);
    const rawResult = result[0] as any;

    return new TimeRangeMetrics({
      last30Days: new Big(rawResult?.last30days || 0),
      last60Days: new Big(rawResult?.last60days || 0),
      last90Days: new Big(rawResult?.last90days || 0),
    });
  }

  async getClientRecentChargebacks(
    clientId: string,
  ): Promise<ChargebackReserve[]> {
    const reserves = await this.repositories.reserve.getRecentChargebacks(
      clientId,
      7,
    );
    return reserves.map(
      ({ amount, createdAt }) =>
        new ChargebackReserve({
          amount: amount,
          createdAt: createdAt,
        }),
    );
  }

  async getPurchaseVolume(
    filters: ObjectQuery<InvoiceEntity>,
  ): Promise<InvoiceVolumeStats> {
    const stats = await this.repositories.invoice.getStats(filters);
    return new InvoiceVolumeStats({
      amount: new Big(stats.total),
      count: stats.count,
    });
  }

  async getClientsAgingGeneralTotal(
    clientIds: string[],
    purchasedBeforeDate: Date,
    paidAfterDate: Date,
    purchasedAfterDate?: Date,
  ): Promise<Map<string, { totalAr: Big; netFundsEmployed: Big }>> {
    const rows = await this.repositories.invoice
      .readOnlyQueryBuilder('i')
      .select([
        `i.${InvoiceEntitySchema.COLUMN_CLIENT_ID}`,
        raw(
          `SUM(i.${InvoiceEntitySchema.COLUMN_APPROVED_FACTOR_FEE}) as total_factor_fee`,
        ),
        raw(
          `SUM(i.${InvoiceEntitySchema.COLUMN_DEDUCTION}) as total_deduction`,
        ),
        raw(
          `SUM(i.${InvoiceEntitySchema.COLUMN_ACCOUNTS_RECEIVABLE_VALUE}) as total`,
        ),
      ])
      .where({
        purchasedDate: {
          $lte: purchasedBeforeDate,
          ...(purchasedAfterDate && { $gte: purchasedAfterDate }),
        },
        clientId: { $in: clientIds },
        recordStatus: RecordStatus.Active,
        $or: [
          {
            paymentDate: {
              $gte: paidAfterDate,
            },
          },
          {
            paymentDate: {
              $eq: null,
            },
          },
        ],
      })
      .groupBy('i.client_id')
      .orderBy({
        'i.client_id': 'ASC',
      })
      .execute('all', false);

    const totalReserves = await this.getTotalReservesForClients(
      clientIds,
      purchasedBeforeDate,
    );
    const map = new Map<string, { totalAr: Big; netFundsEmployed: Big }>();
    for (const row of rows as any[]) {
      const reserveForClient =
        totalReserves.get(row['client_id']) || new Big(0);
      const clientId = row['client_id'] as string;
      const totalAr = new Big(row?.total || 0);
      const totalFactorFee = new Big(row?.total_factor_fee || 0);
      const totalDeduction = new Big(row?.total_deduction || 0);
      const netFundsEmployed = totalAr.sub(totalFactorFee).sub(totalDeduction);
      map.set(clientId, {
        totalAr: totalAr.sub(reserveForClient),
        netFundsEmployed,
      });
    }
    return map;
  }

  async getTotalReservesForClients(
    clientIds: string[],
    endDate?: Date,
  ): Promise<Map<string, Big>> {
    const reserves = await this.repositories.reserve
      .readOnlyQueryBuilder('r')
      .select(['r.client_id', raw('SUM(r.amount) as total')])
      .where({
        clientId: { $in: clientIds },
        recordStatus: RecordStatus.Active,
        createdAt: {
          $lte: endDate,
        },
      })
      .groupBy(['r.client_id'])
      .orderBy({
        'r.client_id': 'DESC',
      })
      .execute('all', false);
    const map = new Map<string, Big>();
    for (const reserve of reserves as any[]) {
      const clientId = reserve['client_id'] as string;
      const total = new Big(reserve?.total || 0);
      map.set(clientId, total);
    }
    return map;
  }
}
