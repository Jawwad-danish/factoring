import {
  endOfYear,
  getFormattedDateInBusinessTimezone,
  startOfYear,
} from '@core/date-time';
import { payableAmount } from '@core/formulas';
import { Arrays, formatToDollars } from '@core/util';
import { Broker, BrokerApi } from '@module-brokers';
import { Client, ClientApi } from '@module-clients';
import {
  InvoiceEntity,
  InvoiceStatus,
  RecordStatus,
  ReportName,
} from '@module-persistence/entities';
import { Repositories } from '@module-persistence/repositories';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import Big from 'big.js';
import { Readable } from 'stream';
import { ClientAnnualReportRequest } from '@fs-bobtail/factoring/data';
import { ClientAnnualReportCommand } from '../../client-annual-report.command';
import { ReportHandler } from '../report-handler';

interface ReportData {
  stats: ReportStats;
  rows: ReportRow[];
}

interface ReportStats {
  year: string;
  clientName: string;
  invoiceFactoredCount: number;
  totalVolume: string;
  paidToClient: string;
  totalFees: string;
}

interface ReportRow {
  approvedDate: null | Date;
  clientName: string;
  brokerName: string;
  loadNumber: string;
  invoiceValue: Big;
  invoiceFees: Big;
  fundedValue: Big;
}

@CommandHandler(ClientAnnualReportCommand)
export class ClientAnnualCommandHandler
  implements ICommandHandler<ClientAnnualReportCommand, Readable>
{
  constructor(
    private readonly reportHandler: ReportHandler,
    private readonly repositories: Repositories,
    private readonly clientApi: ClientApi,
    private readonly brokerApi: BrokerApi,
  ) {}

  async execute({ request }: ClientAnnualReportCommand): Promise<Readable> {
    const { stats, rows } = await this.getReportData(request);
    return this.reportHandler.processReport<ReportRow>(
      request.outputType,
      ReportName.ClientAnnual,
      Readable.from(rows, { objectMode: true }),
      {
        formatDefinition: {
          approvedDate: { type: 'date', label: 'Approved Date' },
          clientName: { type: 'string', label: 'Client' },
          brokerName: { type: 'string', label: 'Debtor' },
          loadNumber: { type: 'string', label: 'Load #' },
          invoiceValue: { type: 'currency', label: 'Invoiced' },
          invoiceFees: { type: 'currency', label: 'Fees' },
          fundedValue: { type: 'currency', label: 'Funded' },
        },
        hbsContext: {
          stats,
        },
        metadataRow: this.getMetadataRow(request),
      },
    );
  }

  async getReportData(request: ClientAnnualReportRequest): Promise<ReportData> {
    const invoices = await this.getInvoices(request);
    const client = await this.clientApi.getById(request.clientId);
    const brokers = await this.brokerApi.findByIds(
      Arrays.uniqueNotNull(invoices, (i) => i.brokerId),
    );
    const rows = this.toReportRows({ client, brokers, invoices });
    const stats = this.getStats({
      client,
      rows,
      year: startOfYear(request.date).format('YYYY'),
    });
    return {
      stats,
      rows,
    };
  }

  private async getInvoices({ clientId, date }: ClientAnnualReportRequest) {
    return await this.repositories.invoice
      .queryBuilder('i')
      .select([
        'id',
        'accountsReceivableValue',
        'approvedFactorFee',
        'brokerId',
        'clientId',
        'deduction',
        'loadNumber',
        'purchasedDate',
        'reserveFee',
      ])
      .where({
        buyout: null,
        clientId,
        purchasedDate: {
          $gte: startOfYear(date).toDate(),
          $lte: endOfYear(date).toDate(),
        },
        status: InvoiceStatus.Purchased,
        recordStatus: RecordStatus.Active,
      })
      .getResult();
  }

  private getStats({
    client,
    rows,
    year,
  }: {
    client: Client;
    rows: ReportRow[];
    year: string;
  }): ReportStats {
    const totalVolume = rows.reduce(
      (acc, row) => row.invoiceValue.plus(acc),
      Big(0),
    );
    const totalFees = rows.reduce(
      (acc, row) => row.invoiceFees.plus(acc),
      Big(0),
    );

    return {
      clientName: client.name,
      invoiceFactoredCount: rows.length,
      totalVolume: formatToDollars(totalVolume),
      totalFees: formatToDollars(totalFees),
      paidToClient: formatToDollars(totalVolume.minus(totalFees)),
      year,
    };
  }

  private toReportRows({
    client,
    brokers,
    invoices,
  }: {
    client: Client;
    brokers: Broker[];
    invoices: InvoiceEntity[];
  }): ReportRow[] {
    return invoices.map((invoice) => {
      const broker = brokers.find((b) => b.id === invoice.brokerId);
      const fundedValue = payableAmount(invoice);
      return {
        approvedDate: invoice.purchasedDate,
        clientName: client.name,
        brokerName: broker?.doingBusinessAs || 'N/A',
        loadNumber: invoice.loadNumber,
        invoiceValue: invoice.accountsReceivableValue,
        invoiceFees: invoice.accountsReceivableValue.minus(fundedValue),
        fundedValue,
      };
    });
  }

  private getMetadataRow(request: ClientAnnualReportRequest): string {
    const forDate = getFormattedDateInBusinessTimezone(request.date);
    const ranDate = getFormattedDateInBusinessTimezone(new Date());
    return `Client Annual Report  ${forDate}` + ` / Date ran: ${ranDate}`;
  }
}
