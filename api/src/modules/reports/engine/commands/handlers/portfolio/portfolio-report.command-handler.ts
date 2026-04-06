import { getFormattedDateInBusinessTimezone } from '@core/date-time';
import { Client, ClientService } from '@module-clients';
import { ReportName } from '@module-persistence/entities';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import Big from 'big.js';
import { Readable } from 'stream';
import { PortfolioReportRequest } from '@fs-bobtail/factoring/data';
import { PortfolioReportCommand } from '../../portfolio-report.command';
import { ReportHandler } from '../report-handler';
import { ReportsDataAccess } from '../../../reports.data-access';
import { RawPortfolioClientsInvoiceAggRow } from '../../../data-access-types';

interface ReportRow {
  registered: Date;
  startDate: Date;
  clientName: string;
  accountManagerName: string;
  state: string;
  clientMC: string;
  clientDOT: string;
  verification: string;
  factorRate: Big;
  totalFactored: Big;
  fees: Big;
  dilution: string;
  AdjDilution: string;
  salesPerson: string;
}

@CommandHandler(PortfolioReportCommand)
export class PortfolioReportCommandHandler
  implements ICommandHandler<PortfolioReportCommand, Readable>
{
  constructor(
    private readonly reportHandler: ReportHandler,
    private readonly clientService: ClientService,
    private readonly reportsDataAccess: ReportsDataAccess,
  ) {}

  async execute({ request }: PortfolioReportCommand): Promise<Readable> {
    const dataStream = await this.getReportDataStream(request);
    return this.reportHandler.processReport<ReportRow>(
      request.outputType,
      ReportName.Portfolio,
      dataStream,
      {
        formatDefinition: {
          registered: { type: 'date', label: 'Registered' },
          startDate: { type: 'date', label: 'Start Date' },
          clientName: { type: 'string', label: 'Client Name' },
          accountManagerName: { type: 'string', label: 'Account Manager' },
          state: { type: 'string', label: 'State' },
          clientMC: { type: 'string', label: 'Client MC' },
          clientDOT: { type: 'string', label: 'Client DOT' },
          verification: { type: 'string', label: 'Verification' },
          factorRate: { type: 'percentage', label: 'Factor Rate' },
          totalFactored: { type: 'currency', label: 'Total Factored' },
          fees: { type: 'currency', label: 'Fees' },
          dilution: { type: 'percentage', label: 'Dilution' },
          AdjDilution: { type: 'percentage', label: 'Adj Dilution' },
          salesPerson: { type: 'string', label: 'Salesperson' },
        },
        metadataRow: this.getMetadataRow(request),
      },
    );
  }

  async getReportDataStream(
    request: PortfolioReportRequest,
  ): Promise<Readable> {
    const clients = await this.getClients(request);
    const clientIds = clients.map((client) => client.client.id);
    const dilutionStatsByClientIds = await this.getDilutionStatsByClientIds(
      request.startDate,
      request.endDate,
      clientIds,
    );
    const rows = this.toReportRows(clients, dilutionStatsByClientIds);
    return Readable.from(rows, {
      objectMode: true,
    });
  }

  private toReportRows(
    clients: {
      client: Client;
      startDate: Date;
      totalFactor: Big;
      totalFee: Big;
    }[],
    dilutionStatsByClientIds: Record<
      string,
      { dilution: number; adjDilution: number }
    >,
  ): ReportRow[] {
    const rows: ReportRow[] = [];
    for (const client of clients) {
      const row: ReportRow = {
        registered: client.client.createdAt,
        startDate: client.startDate,
        clientName: client.client.name,
        accountManagerName:
          client.client.factoringConfig.clientSuccessTeam.name,
        state: client.client?.clientContacts?.[0]?.address?.state ?? 'N/A',
        clientMC: client.client.mc,
        clientDOT: client.client.dot,
        verification: client.client.factoringConfig.requiresVerification
          ? 'Yes'
          : 'No',
        factorRate: client.client.factoringConfig.factoringRatePercentage,
        totalFactored: client.totalFactor,
        fees: client.totalFee,
        dilution:
          dilutionStatsByClientIds[client.client.id].dilution.toString(),
        AdjDilution:
          dilutionStatsByClientIds[client.client.id].adjDilution.toString(),
        salesPerson:
          client.client.factoringConfig.clientSalesRep?.name ?? 'N/A',
      };
      rows.push(row);
    }
    return rows;
  }

  private async getClients(request: PortfolioReportRequest) {
    const invoices = await this.reportsDataAccess.getPortfolioClientsInvoiceAgg(
      request.startDate,
      request.endDate,
    );

    const clientIds = invoices.map((invoice) => invoice.client_id);
    const startDateAndTotalsByClientIds =
      await this.getClientsStartDateAndTotalsByClientIds(clientIds, invoices);

    const clients = await this.clientService.findByIds(clientIds);
    return clients.map((client) => {
      return {
        client: client,
        startDate: startDateAndTotalsByClientIds[client.id]?.start_date,
        totalFactor: startDateAndTotalsByClientIds[client.id]?.total_factor,
        totalFee: startDateAndTotalsByClientIds[client.id]?.total_fee,
      };
    });
  }

  private async getDilutionStatsByClientIds(
    startDate: Date,
    endDate: Date,
    clientIds: string[],
  ) {
    return this.reportsDataAccess.getDilutionRatesByClientIds(
      startDate,
      endDate,
      clientIds,
    );
  }

  private async getClientsStartDateAndTotalsByClientIds(
    clientIds: string[],
    invoices: RawPortfolioClientsInvoiceAggRow[],
  ): Promise<
    Record<
      string,
      {
        start_date: Date;
        total_factor: Big;
        total_fee: Big;
      }
    >
  > {
    const startDatesByClientId: Record<
      string,
      {
        start_date: Date;
        total_factor: Big;
        total_fee: Big;
      }
    > = {};
    for (const clientId of clientIds) {
      const invoice = invoices.find(
        (invoice) => invoice.client_id === clientId,
      );
      if (invoice) {
        startDatesByClientId[clientId] = {
          start_date: invoice.start_date,
          total_factor: new Big(invoice['total_factor'] ?? 0),
          total_fee: new Big(invoice['total_fee'] ?? 0),
        };
      }
    }
    return startDatesByClientId;
  }

  private getMetadataRow(request: PortfolioReportRequest): string {
    const startDate = getFormattedDateInBusinessTimezone(request.startDate);
    const endDate = getFormattedDateInBusinessTimezone(request.endDate);
    const ranDate = getFormattedDateInBusinessTimezone(new Date());
    return `Portfolio Report ${
      request.title ?? `[${startDate} - ${endDate}]`
    } / Date ran: ${ranDate}`;
  }
}
