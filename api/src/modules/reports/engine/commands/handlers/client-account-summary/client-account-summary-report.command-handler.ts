import { Client, ClientService } from '@module-clients';
import { ReportName } from '@module-persistence/entities';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import Big from 'big.js';
import { Readable } from 'stream';
import { ClientAccountSummaryReportRequest } from '@fs-bobtail/factoring/data';
import { ClientAccountSummaryDataAccess } from '../../../client-account-summary.data-access';
import { ClientAccountSummaryReportCommand } from '../../client-account-summary-report.command';
import { ReportHandler } from '../report-handler';
import { getFormattedDateInBusinessTimezone } from '@core/date-time';
import { RawClientAccountSummaryData } from '../../../data-access-types';

interface ReportRow {
  clientName?: string;
  clientDOT?: string;
  clientMC?: string;
  accountManagerName: string;
  days0to30: Big;
  days31to60: Big;
  days61to90: Big;
  days91plus: Big;
  totalInvoices: Big;
  totalFees: Big;
  totalReserve: Big;
  totalAR: Big;
}

@CommandHandler(ClientAccountSummaryReportCommand)
export class ClientAccountSummaryReportCommandHandler
  implements ICommandHandler<ClientAccountSummaryReportCommand, Readable>
{
  constructor(
    private readonly reportHandler: ReportHandler,
    private readonly dataAccess: ClientAccountSummaryDataAccess,
    private readonly clientService: ClientService,
  ) {}

  async execute({
    request,
  }: ClientAccountSummaryReportCommand): Promise<Readable> {
    const dataStream = await this.getReportDataStream(request);
    return this.reportHandler.processReport<ReportRow>(
      request.outputType,
      ReportName.ClientAccountSummary,
      dataStream,
      {
        formatDefinition: {
          clientName: { type: 'string', label: 'Client Name' },
          clientMC: { type: 'string', label: 'Client MC' },
          clientDOT: { type: 'string', label: 'Client DOT' },
          accountManagerName: { type: 'string', label: 'Account Manager' },
          days0to30: { type: 'currency', label: '0-30' },
          days31to60: { type: 'currency', label: '31-60' },
          days61to90: { type: 'currency', label: '61-90' },
          days91plus: { type: 'currency', label: '91+' },
          totalInvoices: { type: 'currency', label: 'Total Invoices' },
          totalFees: { type: 'currency', label: 'Fees' },
          totalReserve: { type: 'currency', label: 'Reserves' },
          totalAR: { type: 'currency', label: 'Total A/R' },
        },
        metadataRow: this.getMetadataRow(request),
      },
    );
  }

  async getReportDataStream(
    request: ClientAccountSummaryReportRequest,
  ): Promise<Readable> {
    const accountSummariesByClient = await this.dataAccess.getData(
      request.date,
    );
    const clientIds = Array.from(accountSummariesByClient.keys());
    const clients = await this.clientService.findByIds(clientIds);
    const rows = this.toReportRows(clients, accountSummariesByClient);
    return Readable.from(rows, {
      objectMode: true,
    });
  }

  private toReportRows(
    clients: Client[],
    accountSummariesByClient: Map<string, RawClientAccountSummaryData>,
  ): ReportRow[] {
    const rows: ReportRow[] = [];

    const totalsRow: ReportRow = {
      clientName: 'Totals',
      clientMC: 'N/A',
      clientDOT: 'N/A',
      accountManagerName: 'N/A',
      days0to30: Big(0),
      days31to60: Big(0),
      days61to90: Big(0),
      days91plus: Big(0),
      totalFees: Big(0),
      totalAR: Big(0),
      totalInvoices: Big(0),
      totalReserve: Big(0),
    };

    const clientsMap = new Map(clients.map((client) => [client.id, client]));

    for (const [clientId, clientAccountSummary] of accountSummariesByClient) {
      const client = clientsMap.get(clientId);

      const totalInvoicesForClient = Big(clientAccountSummary.days0to30)
        .add(clientAccountSummary.days31to60)
        .add(clientAccountSummary.days61to90)
        .add(clientAccountSummary.days91plus);

      const totalARForClient = totalInvoicesForClient.minus(
        clientAccountSummary.reservesTotal,
      );
      const row: ReportRow = {
        clientName: client?.name || 'N/A',
        clientMC: client?.mc || 'N/A',
        clientDOT: client?.dot || 'N/A',
        accountManagerName:
          client?.factoringConfig?.clientSuccessTeam.name || 'N/A',
        days0to30: Big(clientAccountSummary.days0to30),
        days31to60: Big(clientAccountSummary.days31to60),
        days61to90: Big(clientAccountSummary.days61to90),
        days91plus: Big(clientAccountSummary.days91plus),
        totalFees: Big(clientAccountSummary.factorFeesTotal),
        totalAR: totalARForClient,
        totalInvoices: totalInvoicesForClient,
        totalReserve: Big(clientAccountSummary.reservesTotal),
      };
      rows.push(row);
      this.addRowToTotals(row, totalsRow);
    }

    rows.push(totalsRow);
    return rows;
  }

  private addRowToTotals(row: ReportRow, totalsRow: ReportRow) {
    totalsRow.days0to30 = totalsRow.days0to30.plus(row.days0to30);
    totalsRow.days31to60 = totalsRow.days31to60.plus(row.days31to60);
    totalsRow.days61to90 = totalsRow.days61to90.plus(row.days61to90);
    totalsRow.days91plus = totalsRow.days91plus.plus(row.days91plus);
    totalsRow.totalFees = totalsRow.totalFees.plus(row.totalFees);
    totalsRow.totalAR = totalsRow.totalAR.plus(row.totalAR);
    totalsRow.totalInvoices = totalsRow.totalInvoices.plus(row.totalInvoices);
    totalsRow.totalReserve = totalsRow.totalReserve.plus(row.totalReserve);
  }

  private getMetadataRow(request: ClientAccountSummaryReportRequest): string {
    const forDate = getFormattedDateInBusinessTimezone(request.date);
    const ranDate = getFormattedDateInBusinessTimezone(new Date());
    return (
      `Client Account Summary Report  ${forDate}` + ` / Date ran: ${ranDate}`
    );
  }
}
