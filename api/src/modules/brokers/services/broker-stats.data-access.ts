import { TimeRangeMetrics } from '@common/data';
import { percentageOfNumber } from '@core/formulas';
import { raw } from '@mikro-orm/core';
import {
  BrokerFactoringStatsEntity,
  BrokerPaymentStatus,
  InvoiceStatus,
  RecordStatus,
} from '@module-persistence/entities';
import {
  BrokerFactoringStatsRepository,
  BrokerPaymentRepository,
  InvoiceRepository,
} from '@module-persistence/repositories';
import { Injectable } from '@nestjs/common';
import Big from 'big.js';

@Injectable()
export class BrokerStatsDataAccess {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly brokerPaymentRepository: BrokerPaymentRepository,
    private readonly brokerFactoringStatsRepository: BrokerFactoringStatsRepository,
  ) {}

  async findFactoringStatsForBrokers(
    brokerIds: string[],
  ): Promise<BrokerFactoringStatsEntity[]> {
    return this.brokerFactoringStatsRepository.findByBrokerIds(brokerIds);
  }

  async getOrCreate(brokerId: string): Promise<BrokerFactoringStatsEntity> {
    const statsEntity = await this.getOrCreateFactoringStatsForBrokers([
      brokerId,
    ]);
    return statsEntity[0];
  }

  async getOrCreateFactoringStatsForBrokers(
    brokerIds: string[],
  ): Promise<BrokerFactoringStatsEntity[]> {
    const brokerFactoringStats =
      await this.brokerFactoringStatsRepository.findByBrokerIds(brokerIds);
    const brokersWithoutStats = brokerIds.filter(
      (brokerId) =>
        !brokerFactoringStats.find(
          (statsEntity) => statsEntity.brokerId === brokerId,
        ),
    );
    for (const brokerId of brokersWithoutStats) {
      brokerFactoringStats.push(this.createFactoringStats(brokerId));
    }
    return brokerFactoringStats;
  }

  private createFactoringStats(brokerId: string): BrokerFactoringStatsEntity {
    const brokerFactoringStats = new BrokerFactoringStatsEntity();
    brokerFactoringStats.brokerId = brokerId;
    this.brokerFactoringStatsRepository.persist(brokerFactoringStats);
    return brokerFactoringStats;
  }

  async getTotalClientsWorkingWith(brokerId: string): Promise<number> {
    const result = await this.invoiceRepository
      .queryBuilder('i')
      .select(raw('COUNT(DISTINCT i.client_id) as total'))
      .where({
        brokerId,
        recordStatus: RecordStatus.Active,
      })
      .execute('all', false);

    const rawResult = result[0] as any;
    return Number(rawResult?.total || 0);
  }

  async getLastPaymentDate(brokerId: string): Promise<null | Date> {
    const invoices = await this.invoiceRepository
      .queryBuilder('i')
      .select('paymentDate')
      .where({
        brokerId,
        brokerPaymentStatus: [
          BrokerPaymentStatus.InFull,
          BrokerPaymentStatus.ShortPaid,
          BrokerPaymentStatus.Overpaid,
        ],
        recordStatus: RecordStatus.Active,
        paymentDate: {
          $ne: null,
        },
      })
      .orderBy({
        paymentDate: 'DESC',
      })
      .limit(1)
      .execute('all', true);
    return invoices[0]?.paymentDate || null;
  }

  async getTotalAging(brokerId: string): Promise<number> {
    const result = await this.invoiceRepository
      .queryBuilder('i')
      .select(raw('SUM(i.accounts_receivable_value) as total'))
      .where({
        brokerId,
        brokerPaymentStatus: [
          BrokerPaymentStatus.NonPayment,
          BrokerPaymentStatus.NotReceived,
          BrokerPaymentStatus.NonFactoredPayment,
        ],
      })
      .execute('all', false);

    const rawResult = result[0] as any;
    return Number(rawResult?.total || 0);
  }

  async getDilutionMetrics(brokerId: string): Promise<TimeRangeMetrics> {
    const result = await this.brokerPaymentRepository
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
          brokerId,
          brokerPaymentStatus: BrokerPaymentStatus.ShortPaid,
          recordStatus: RecordStatus.Active,
        },
      })
      .execute('all', false);
    const rawResult = result[0] as any;
    const totalAmount =
      await this.invoiceRepository.totalAccountsReceivableByBroker(brokerId);
    if (totalAmount === 0) {
      return {
        last30Days: new Big(99),
        last60Days: new Big(99),
        last90Days: new Big(99),
      };
    }

    return new TimeRangeMetrics({
      last30Days: percentageOfNumber(rawResult?.last30days || 0, totalAmount),
      last60Days: percentageOfNumber(rawResult?.last60days || 0, totalAmount),
      last90Days: percentageOfNumber(rawResult?.last90days || 0, totalAmount),
    });
  }

  async getDaysToPayAverageMetrics(
    brokerIds: string[],
  ): Promise<{ brokerId: string; metrics: TimeRangeMetrics }[]> {
    const queryBuilder = this.invoiceRepository.queryBuilder('i');
    const result = await queryBuilder
      .select(
        raw(
          `i.broker_id,
           AVG(CASE WHEN i.created_at >= NOW() - INTERVAL '30 days' THEN EXTRACT(EPOCH FROM (i.payment_date - i.purchased_date)) / 86400 ELSE NULL END) as last30days,
           AVG(CASE WHEN i.created_at >= NOW() - INTERVAL '60 days' THEN EXTRACT(EPOCH FROM (i.payment_date - i.purchased_date)) / 86400 ELSE NULL END) as last60days,
           AVG(CASE WHEN i.created_at >= NOW() - INTERVAL '90 days' THEN EXTRACT(EPOCH FROM (i.payment_date - i.purchased_date)) / 86400 ELSE NULL END) as last90days`,
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

  async getTotalAmounts(brokerId: string) {
    const result = await this.invoiceRepository
      .queryBuilder('i')
      .select(
        raw(
          `SUM(CASE WHEN i.status = '${InvoiceStatus.UnderReview}' THEN i.value ELSE 0 END) AS total_under_review,
      SUM(CASE WHEN i.status = '${InvoiceStatus.Purchased}' THEN i.value ELSE 0 END) AS total_purchased,
      SUM(CASE WHEN i.broker_payment_status = '${BrokerPaymentStatus.ShortPaid}' THEN i.value ELSE 0 END) AS total_shortpaid,
      SUM(CASE WHEN i.broker_payment_status = '${BrokerPaymentStatus.NotReceived}' THEN i.value ELSE 0 END) AS total_not_received,
      SUM(CASE WHEN i.broker_payment_status = '${BrokerPaymentStatus.NonPayment}' THEN i.value ELSE 0 END) AS total_nonpayment`,
        ),
      )
      .where({
        recordStatus: RecordStatus.Active,
        brokerId,
      })
      .execute('all', false);
    const rawResult = result[0] as any;
    return {
      totalUnderReview: rawResult?.total_under_review || 0,
      totalPurchased: rawResult?.total_purchased || 0,
      totalShortPaid: rawResult?.total_shortpaid || 0,
      totalNotReceived: rawResult?.total_not_received || 0,
      totalNonPayment: rawResult?.total_nonpayment || 0,
    };
  }

  async overallAverageDaysToPay(brokerId: string): Promise<number> {
    const query = `SELECT AVG(DATE_PART('day', bp.earliest_batch_date - i.purchased_date)) AS avg_days_to_pay
     FROM (SELECT invoice_id, MIN(batch_date) AS earliest_batch_date FROM broker_payments WHERE record_status = '${RecordStatus.Active}' GROUP BY invoice_id) bp
 JOIN invoices i ON bp.invoice_id = i.id WHERE i.broker_id = '${brokerId}'
 AND i.status = '${InvoiceStatus.Purchased}'
 AND i.record_status = '${RecordStatus.Active}'`;

    const queryResult = await this.invoiceRepository.execute(query);
    const rawResult = queryResult[0] as any;
    return rawResult?.avg_days_to_pay
      ? Number(Big(rawResult?.avg_days_to_pay).toFixed(0, 1))
      : -1;
  }

  async getTopBrokersByAging(
    limit = 50,
  ): Promise<BrokerFactoringStatsEntity[]> {
    return this.brokerFactoringStatsRepository.find(
      {},
      {
        limit,
        orderBy: {
          totalAging: 'DESC',
        },
      },
    );
  }
}
