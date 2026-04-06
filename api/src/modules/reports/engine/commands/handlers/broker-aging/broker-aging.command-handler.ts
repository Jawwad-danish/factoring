import { getFormattedDateInBusinessTimezone } from '@core/date-time';
import { Arrays } from '@core/util';
import { BrokerAgingReportCreateRequest } from '@fs-bobtail/factoring/data';
import { raw } from '@mikro-orm/core';
import { Broker, BrokerService } from '@module-brokers';
import {
  InvoiceEntity,
  RecordStatus,
  ReportName,
} from '@module-persistence/entities';
import { Repositories } from '@module-persistence/repositories';
import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import Big from 'big.js';
import dayjs from 'dayjs';
import { Readable } from 'stream';
import { FormatDefinition } from '../../../serialization/serialization-options';
import { BrokerAgingReportCommand } from '../../broker-aging-report.command';
import { ReportHandler } from '../report-handler';
import { ReportsDataAccess } from '../../../reports.data-access';

interface BrokerAgingStats {
  totalCurrent: Big;
  total0To30Days: Big;
  total31To60Days: Big;
  total61To90Days: Big;
  totalOver91Days: Big;
  daysToPayLast30Days: string;
}

interface ReportRow {
  brokerName: string;
  brokerMC: string;
  brokerDOT: string;
  brokerAddress?: string;
  brokerCity?: string;
  brokerState?: string;
  brokerZip?: string;
  brokerLimit: string;
  totalPurchased0To30Days: Big;
  totalPurchased31To60Days: Big;
  totalPurchased61To90Days: Big;
  totalPurchasedOver91Days: Big;
  daysToPayLast30Days: string;
  totalInvoices: Big;
  rating: string;
}

@CommandHandler(BrokerAgingReportCommand)
export class BrokerAgingReportCommandHandler
  implements ICommandHandler<BrokerAgingReportCommand, Readable>
{
  private readonly logger = new Logger(BrokerAgingReportCommandHandler.name);

  constructor(
    private readonly reportHandler: ReportHandler,
    private readonly repositories: Repositories,
    private readonly brokerService: BrokerService,
    private readonly dataAccess: ReportsDataAccess,
  ) {}

  async execute({ request }: BrokerAgingReportCommand): Promise<Readable> {
    const dataStream = await this.getReportDataStream(request);
    const formatDefinition: FormatDefinition<ReportRow> = {
      brokerName: { type: 'string', label: 'Name' },
      brokerMC: { type: 'string', label: 'MC' },
      brokerDOT: { type: 'string', label: 'DOT' },
      brokerLimit: { type: 'string', label: 'Limit' },
      totalPurchased0To30Days: { type: 'currency', label: '0-30 Days' },
      totalPurchased31To60Days: { type: 'currency', label: '31-60 Days' },
      totalPurchased61To90Days: { type: 'currency', label: '61-90 Days' },
      totalPurchasedOver91Days: { type: 'currency', label: 'Over 91 Days' },
      totalInvoices: { type: 'currency', label: 'Total Invoices' },
      daysToPayLast30Days: {
        type: 'number',
        label: 'Days To Pay Last 30 Days',
      },
      rating: { type: 'string', label: 'Rating' },
    };

    if (request.includeAddress) {
      formatDefinition.brokerAddress = { type: 'string', label: 'Address' };
      formatDefinition.brokerCity = { type: 'string', label: 'City' };
      formatDefinition.brokerState = { type: 'string', label: 'State' };
      formatDefinition.brokerZip = { type: 'string', label: 'Zip' };
    }

    return this.reportHandler.processReport<ReportRow>(
      request.outputType,
      ReportName.BrokerAging,
      dataStream,
      {
        formatDefinition,
        metadataRow: this.getMetadataRow(request),
      },
    );
  }

  private async getReportDataStream(
    request: BrokerAgingReportCreateRequest,
  ): Promise<Readable> {
    this.logger.log(`Fetching data for ${ReportName.BrokerAging}...`);
    const brokersWithTotals = await this.calculateAgingBuckets(request.date);

    const brokerIds = Arrays.uniqueNotNull(
      Array.from(brokersWithTotals.keys()),
      (brokerId) => brokerId,
    );

    const brokers = await this.brokerService.findByIds(Array.from(brokerIds));

    const rows = this.toReportRows(
      request.includeAddress ?? false,
      brokersWithTotals,
      brokers,
    );
    return Readable.from(rows, {
      objectMode: true,
    });
  }

  private async calculateAgingBuckets(
    date: Date,
  ): Promise<Map<string, BrokerAgingStats>> {
    const endOfDay = dayjs(date).endOf('day').toDate();
    const dateMinus30 = dayjs(endOfDay).subtract(30, 'days').toDate();
    const dateMinus60 = dayjs(endOfDay).subtract(60, 'days').toDate();
    const dateMinus90 = dayjs(endOfDay).subtract(90, 'days').toDate();

    const [
      totalCurrent,
      total0To30Days,
      total31To60Days,
      total61To90Days,
      totalOver91Days,
    ] = await Promise.all([
      this.getBrokerAgingGeneralTotal(endOfDay, endOfDay),
      this.getBrokerAgingGeneralTotal(endOfDay, endOfDay, dateMinus30),
      this.getBrokerAgingGeneralTotal(dateMinus30, endOfDay, dateMinus60),
      this.getBrokerAgingGeneralTotal(dateMinus60, endOfDay, dateMinus90),
      this.getBrokerAgingGeneralTotal(dateMinus90, endOfDay),
    ]);

    const brokerStatsMap = new Map<string, BrokerAgingStats>();

    const processResults = (
      results: any[],
      statType: Exclude<keyof BrokerAgingStats, 'daysToPayLast30Days'>,
    ) => {
      for (const result of results) {
        const brokerId = result.broker_id;
        const total = new Big(result.total || 0);

        if (!brokerStatsMap.has(brokerId)) {
          brokerStatsMap.set(brokerId, {
            totalCurrent: new Big(0),
            total0To30Days: new Big(0),
            total31To60Days: new Big(0),
            total61To90Days: new Big(0),
            totalOver91Days: new Big(0),
            daysToPayLast30Days: 'N/A',
          });
        }

        const brokerStats = brokerStatsMap.get(brokerId)!;
        brokerStats[statType] = total;
      }
    };

    processResults(totalCurrent, 'totalCurrent');
    processResults(total0To30Days, 'total0To30Days');
    processResults(total31To60Days, 'total31To60Days');
    processResults(total61To90Days, 'total61To90Days');
    processResults(totalOver91Days, 'totalOver91Days');

    const brokerIds = Array.from(brokerStatsMap.keys());

    if (brokerIds.length > 0) {
      const daysToPayResults =
        await this.dataAccess.getDaysToPayAverageMetricsByPaymentDate(
          brokerIds,
        );
      for (const result of daysToPayResults) {
        const brokerId = result.brokerId;
        const last30DaysValue = result.metrics.last30Days;
        const avgDaysToPay = last30DaysValue.eq(0)
          ? 'N/A'
          : Math.round(last30DaysValue.toNumber());

        if (brokerStatsMap.has(brokerId)) {
          const brokerStats = brokerStatsMap.get(brokerId)!;
          brokerStats.daysToPayLast30Days = avgDaysToPay.toString();
        }
      }
    }

    return brokerStatsMap;
  }

  private async getBrokerAgingGeneralTotal(
    beforeDate: Date,
    paidAfterDate: Date,
    afterDate?: Date,
  ): Promise<InvoiceEntity[]> {
    const results = await this.repositories.invoice
      .readOnlyQueryBuilder('i')
      .select(['i.broker_id', raw('SUM(i.accounts_receivable_value) as total')])
      .where({
        recordStatus: RecordStatus.Active,
        purchasedDate: {
          $lte: beforeDate,
          ...(afterDate && { $gte: afterDate }),
        },
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
      .groupBy('i.broker_id')
      .orderBy({
        'i.broker_id': 'ASC',
      })
      .execute('all', false);

    return results;
  }

  private toReportRows(
    includeAddress: boolean,
    agingBuckets: Map<string, BrokerAgingStats>,
    brokers: Broker[],
  ): ReportRow[] {
    const rows: ReportRow[] = [];

    let total0To30 = new Big(0);
    let total31To60 = new Big(0);
    let total61To90 = new Big(0);
    let totalOver91 = new Big(0);
    let totalInvoicesSum = new Big(0);

    for (const [brokerId, brokerTotals] of agingBuckets) {
      const broker = brokers.find((b) => b.id === brokerId);

      total0To30 = total0To30.plus(brokerTotals.total0To30Days);
      total31To60 = total31To60.plus(brokerTotals.total31To60Days);
      total61To90 = total61To90.plus(brokerTotals.total61To90Days);
      totalOver91 = totalOver91.plus(brokerTotals.totalOver91Days);
      totalInvoicesSum = totalInvoicesSum.plus(brokerTotals.totalCurrent);

      rows.push({
        brokerName: broker?.legalName || '',
        brokerMC: broker?.mc || '',
        brokerDOT: broker?.dot || '',
        brokerLimit: broker?.factoringConfig?.limitAmount?.toString() || '',
        totalPurchased0To30Days: brokerTotals.total0To30Days,
        totalPurchased31To60Days: brokerTotals.total31To60Days,
        totalPurchased61To90Days: brokerTotals.total61To90Days,
        totalPurchasedOver91Days: brokerTotals.totalOver91Days,
        daysToPayLast30Days: brokerTotals.daysToPayLast30Days,
        totalInvoices: brokerTotals.totalCurrent,
        rating: broker?.displayRating() || '',
      });
      if (includeAddress) {
        const officeAddress = broker?.addresses?.find(
          (address) => address.type === 'office',
        );
        rows[rows.length - 1].brokerAddress = officeAddress?.address || '';
        rows[rows.length - 1].brokerCity = officeAddress?.city || '';
        rows[rows.length - 1].brokerState = officeAddress?.state || '';
        rows[rows.length - 1].brokerZip = officeAddress?.zip || '';
      }
    }

    rows.push({
      brokerName: 'Total',
      brokerMC: '',
      brokerDOT: '',
      brokerLimit: '',
      totalPurchased0To30Days: total0To30,
      totalPurchased31To60Days: total31To60,
      totalPurchased61To90Days: total61To90,
      totalPurchasedOver91Days: totalOver91,
      daysToPayLast30Days: 'N/A',
      totalInvoices: totalInvoicesSum,
      rating: '',
    });
    return rows;
  }

  private getMetadataRow(request: BrokerAgingReportCreateRequest): string {
    const forDate = getFormattedDateInBusinessTimezone(request.date);
    const ranDate = getFormattedDateInBusinessTimezone(new Date());
    return `Broker Aging Report  ${forDate}` + ` / Date ran: ${ranDate}`;
  }
}
