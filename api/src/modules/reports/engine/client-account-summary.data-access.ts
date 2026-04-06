import dayjs from 'dayjs';
import { endOfDay } from '@core/date-time';
import { raw } from '@mikro-orm/postgresql';
import {
  BrokerPaymentStatus,
  ClientPaymentStatus,
  InvoiceStatus,
  RecordStatus,
  Repositories,
} from '@module-persistence';
import { Injectable, Logger } from '@nestjs/common';
import { RawClientAccountSummaryData } from './data-access-types';

@Injectable()
export class ClientAccountSummaryDataAccess {
  private readonly logger = new Logger(ClientAccountSummaryDataAccess.name);

  constructor(private readonly repositories: Repositories) {}

  async getData(
    invoicesPurchasedUntil: Date,
  ): Promise<Map<string, RawClientAccountSummaryData>> {
    const reportDate = endOfDay(invoicesPurchasedUntil).toDate();
    const dateMinus30 = dayjs(reportDate).subtract(30, 'days').toDate();
    const dateMinus60 = dayjs(reportDate).subtract(60, 'days').toDate();
    const dateMinus90 = dayjs(reportDate).subtract(90, 'days').toDate();

    const invoicesSum = (await this.repositories.invoice
      .readOnlyQueryBuilder('i')
      .select([
        'i.client_id',
        raw(
          `SUM(case when i.purchased_date >= ? then i.accounts_receivable_value else 0 end) as days_0_to_30,
          SUM(case when i.purchased_date < ? AND i.purchased_date >= ? then i.accounts_receivable_value else 0 end) as days_31_to_60,
          SUM(case when i.purchased_date < ? AND i.purchased_date >= ? then i.accounts_receivable_value else 0 end) as days_61_to_90,
          SUM(case when i.purchased_date < ? then i.accounts_receivable_value else 0 end) as days_91_plus,
          SUM(i.approved_factor_fee) as factor_fees_total`,
          [
            dateMinus30,
            dateMinus30,
            dateMinus60,
            dateMinus60,
            dateMinus90,
            dateMinus90,
          ],
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
        purchasedDate: { $lte: invoicesPurchasedUntil },
      })
      .groupBy('i.client_id')
      .execute('all', false)) as any;

    const reservesTotal = (await this.repositories.reserve
      .readOnlyQueryBuilder('r')
      .select(['r.client_id', raw('SUM(r.amount) as total')])
      .where({
        recordStatus: RecordStatus.Active,
        createdAt: { $lte: invoicesPurchasedUntil },
      })
      .groupBy('r.client_id')
      .execute('all', false)) as any;

    const invoicesSumMap = new Map(
      invoicesSum.map((invoice) => [invoice.client_id, invoice]),
    );
    const reservesTotalMap = new Map(
      reservesTotal.map((reserve) => [reserve.client_id, reserve]),
    );

    const allClientIds = new Set([
      ...invoicesSum.map((invoice) => invoice.client_id),
      ...reservesTotal.map((reserve) => reserve.client_id),
    ]);

    this.logger.log(
      `Found ${invoicesSum.length} clients with invoices and ${reservesTotal.length} clients with reserves (${allClientIds.size} unique clients)`,
    );

    const map = new Map<string, RawClientAccountSummaryData>();
    for (const clientId of allClientIds) {
      const invoicesResult = invoicesSumMap.get(clientId) as any;
      const reservesResult = reservesTotalMap.get(clientId) as any;

      map.set(clientId, {
        clientId,
        days0to30: invoicesResult?.days_0_to_30 || 0,
        days31to60: invoicesResult?.days_31_to_60 || 0,
        days61to90: invoicesResult?.days_61_to_90 || 0,
        days91plus: invoicesResult?.days_91_plus || 0,
        factorFeesTotal: invoicesResult?.factor_fees_total || 0,
        reservesTotal: reservesResult?.total || 0,
      });
    }
    return map;
  }
}
