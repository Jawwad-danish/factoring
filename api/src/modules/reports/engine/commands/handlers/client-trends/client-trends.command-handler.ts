import {
  getDateInBusinessTimezone,
  getFormattedDateInBusinessTimezone,
} from '@core/date-time';
import { ClientTrendsReportCreateRequest } from '@fs-bobtail/factoring/data';
import { ReportName } from '@module-persistence';
import { ClientFactoringConfigsRepository } from '@module-persistence/repositories';
import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import Big from 'big.js';
import { Readable } from 'stream';
import { ClientTrendsReportsDataAccess } from '../../../client-trends.data-access';
import { ClientTrendsReportCommand } from '../../client-trends-report.command';
import { ReportHandler } from '../report-handler';
import { ClientApi } from '@module-clients';

interface ReportRow {
  monthYear: string;
  monthlyInvoices: Big;
  averageInvoices: Big;
  monthlyFactor: Big;
  reservesAccountReceivable: Big;
  invoiceAccountReceivable: Big;
  totalAccountReceivable: Big;
  factorFees: Big;
  deductions: Big;
  netFundsEmployed: Big;
  yield: Big;
  dilution: string;
  adjDilution: string;
  daysToPay: string;
  daysToPost: string;
}

@CommandHandler(ClientTrendsReportCommand)
export class ClientTrendsReportCommandHandler
  implements ICommandHandler<ClientTrendsReportCommand, Readable>
{
  private readonly logger = new Logger(ClientTrendsReportCommandHandler.name);

  constructor(
    private readonly reportHandler: ReportHandler,
    private readonly clientTrendsDataAccess: ClientTrendsReportsDataAccess,
    private readonly clientApi: ClientApi,
    private readonly clientFactoringConfigsRepository: ClientFactoringConfigsRepository,
  ) {}

  async execute({ request }: ClientTrendsReportCommand): Promise<Readable> {
    const dataStream = await this.getReportDataStream(request);
    return this.reportHandler.processReport<ReportRow>(
      request.outputType,
      ReportName.ClientTrends,
      dataStream,
      {
        formatDefinition: {
          monthYear: { type: 'string', label: 'Month-Year' },
          monthlyInvoices: { type: 'currency', label: 'Monthly Invoiced' },
          averageInvoices: { type: 'currency', label: 'Average Invoice' },
          monthlyFactor: { type: 'currency', label: 'Monthly Factor Fees' },
          reservesAccountReceivable: {
            type: 'currency',
            label: 'Reserves A/R',
          },
          invoiceAccountReceivable: { type: 'currency', label: 'Invoices A/R' },
          totalAccountReceivable: { type: 'currency', label: 'Total A/R' },
          factorFees: { type: 'currency', label: 'Factor Fees' },
          deductions: { type: 'currency', label: 'Deductions' },
          netFundsEmployed: { type: 'currency', label: 'Net Funds Employed' },
          yield: {
            type: 'percentage',
            label: 'Yield',
            options: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
          },
          dilution: {
            type: 'percentage',
            label: 'Dilution',
            options: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
          },
          adjDilution: {
            type: 'percentage',
            label: 'Adj Dilution',
            options: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
          },
          daysToPay: { type: 'string', label: 'Days to Pay' },
          daysToPost: { type: 'string', label: 'Days to Post' },
        },
        metadataRow: await this.getMetadataRow(request.clientId ?? null),
      },
    );
  }

  private async getReportDataStream(
    request: ClientTrendsReportCreateRequest,
  ): Promise<Readable> {
    this.logger.log(`Building ${ReportName.ClientTrends} dataset...`);

    const clientId = request.clientId ?? null;

    const businessNow = getDateInBusinessTimezone(new Date());
    const windowStart = businessNow
      .clone()
      .subtract(12, 'months')
      .startOf('month');
    const windowEnd = businessNow.clone().endOf('month');

    const rows: ReportRow[] = [];

    for (
      let cursor = windowStart.clone();
      cursor.isBefore(windowEnd) || cursor.isSame(windowEnd, 'month');
      cursor = cursor.add(1, 'month').startOf('month')
    ) {
      const monthStart = cursor.startOf('month');
      const monthEnd = cursor.endOf('month');

      const {
        invoiced,
        averageInvoice,
        factorFees: monthFactorFees,
        yieldVal,
      } = await this.clientTrendsDataAccess.getInvoicedAverageFeesAndYield(
        monthStart.toDate(),
        monthEnd.toDate(),
        clientId,
      );

      const reservesAsOfNumber =
        await this.clientTrendsDataAccess.getReservesUntilDate(
          monthEnd.toDate(),
          clientId,
        );
      const reservesAsOf = new Big(reservesAsOfNumber ?? 0);

      const {
        invoicesAR,
        totalFactorFees: factorFeesToDate,
        totalDeductions: deductionsToDate,
        totalNfe: nfeToDate,
      } = await this.clientTrendsDataAccess.getInvoiceARFeesDeductionsNfeAtDate(
        monthEnd.toDate(),
        clientId,
      );

      const totalAr = invoicesAR.minus(reservesAsOf);

      const { dilution, adjDilution, daysToPay, daysToPost } =
        await this.clientTrendsDataAccess.getDilutionStats(
          monthStart.toDate(),
          monthEnd.toDate(),
          clientId,
        );

      rows.push({
        monthYear: monthStart.format('MMM-YYYY'),
        monthlyInvoices: invoiced,
        averageInvoices: averageInvoice,
        monthlyFactor: monthFactorFees,
        reservesAccountReceivable: reservesAsOf,
        invoiceAccountReceivable: invoicesAR,
        totalAccountReceivable: totalAr,
        factorFees: factorFeesToDate,
        deductions: deductionsToDate,
        netFundsEmployed: nfeToDate,
        yield: yieldVal,
        dilution: dilution.toFixed(),
        adjDilution: adjDilution.toFixed(),
        daysToPay: daysToPay.toFixed(),
        daysToPost: daysToPost.toFixed(),
      });
    }

    return Readable.from(rows, { objectMode: true });
  }

  private async getClientMetadata(clientId: string): Promise<{
    name: string;
    mc: string;
    dot: string;
    accountManager: string;
  }> {
    const client = await this.clientApi.findById(clientId);

    const teamName =
      (await this.clientFactoringConfigsRepository.findClientSuccessTeamNameByClientId(
        clientId,
      )) ?? 'N/A';

    return {
      name: client?.name ?? 'N/A',
      mc: client?.mc ?? 'N/A',
      dot: client?.dot ?? 'N/A',
      accountManager: teamName,
    };
  }

  private async getMetadataRow(clientId: string | null): Promise<string> {
    const ranDate = getFormattedDateInBusinessTimezone(new Date());
    const base = `Client Trends Report / Date ran: ${ranDate}`;

    if (!clientId) {
      return base;
    }

    const { name, mc, dot, accountManager } = await this.getClientMetadata(
      clientId,
    );

    return `${base} - ${name} (MC: ${mc} / DOT: ${dot} / Account Manager : ${accountManager})`;
  }
}
