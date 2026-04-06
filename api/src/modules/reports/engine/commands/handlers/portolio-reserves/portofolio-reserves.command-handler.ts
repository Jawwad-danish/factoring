import { getFormattedDateInBusinessTimezone } from '@core/date-time';
import { Maps } from '@core/util';
import { PortoflioReserveReportRequest } from '@fs-bobtail/factoring/data';
import { Loaded, raw } from '@mikro-orm/core';
import { Client, ClientService } from '@module-clients';
import {
  ReportName,
  ReserveEntity,
  ReserveReason,
} from '@module-persistence/entities';
import { Repositories } from '@module-persistence/repositories';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import Big from 'big.js';
import { Readable } from 'stream';
import { PortoflioReserveReportCommand } from '../../portoflio-reserve-report.command';
import { ReportHandler } from '../report-handler';

type LoadedReserve = Loaded<
  ReserveEntity,
  never,
  | 'id'
  | 'amount'
  | 'createdAt'
  | 'clientId'
  | 'reason'
  | 'reserveInvoice.invoice.loadNumber',
  never
>;

interface ReportRow {
  date: Date;
  clientName?: string;
  clientDOT?: string;
  clientMC?: string;
  type: ReserveReason;
  loadNumber: string;
  reserveAmount: Big;
  reserveBalance: Big;
}

@CommandHandler(PortoflioReserveReportCommand)
export class PortoflioReserveReportCommandHandler
  implements ICommandHandler<PortoflioReserveReportCommand, Readable>
{
  constructor(
    private readonly reportHandler: ReportHandler,
    private readonly repositories: Repositories,
    private readonly clientService: ClientService,
  ) {}

  async execute({ request }: PortoflioReserveReportCommand): Promise<Readable> {
    const dataStream = await this.getReportDataStream(request);
    return this.reportHandler.processReport<ReportRow>(
      request.outputType,
      ReportName.PortfolioReserve,
      dataStream,
      {
        formatDefinition: {
          date: { type: 'date-time', label: 'Date' },
          type: { type: 'string', label: 'Type' },
          loadNumber: { type: 'string', label: 'Load Number' },
          reserveAmount: { type: 'currency', label: 'Reserve Amount' },
          reserveBalance: { type: 'currency', label: 'Reserve Balance' },
          clientName: { type: 'string', label: 'Client Name' },
          clientDOT: { type: 'string', label: 'Client DOT' },
          clientMC: { type: 'string', label: 'Client MC' },
        },
        metadataRow: this.getMetadataRow(request),
      },
    );
  }

  async getReportDataStream(
    request: PortoflioReserveReportRequest,
  ): Promise<Readable> {
    const clientReservesAssoc = await this.getReservesGroupedByClient(request);
    const clientIds = Array.from(clientReservesAssoc.keys());
    const clientSumsAssoc = await this.getSumsGroupedByClient(
      clientIds,
      request.startDate,
    );
    const clients = await this.clientService.findByIds(clientIds);
    const rows = await this.toReportRows({
      clients,
      clientReservesAssoc,
      clientSumsAssoc,
    });
    return Readable.from(rows, {
      objectMode: true,
    });
  }

  private async getReservesGroupedByClient({
    startDate,
    endDate,
  }: PortoflioReserveReportRequest): Promise<Map<string, LoadedReserve[]>> {
    const reserves = await this.repositories.getEntityManager().find(
      ReserveEntity,
      {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      },
      {
        fields: [
          'id',
          'amount',
          'clientId',
          'createdAt',
          'reason',
          'reserveInvoice.invoice.loadNumber',
        ],
      },
    );
    const clientReservesAssoc = new Map<string, typeof reserves>();
    for (const reserve of reserves) {
      const reservesPerClient = Maps.getOrDefault(
        clientReservesAssoc,
        reserve.clientId,
        [],
      );
      reservesPerClient.push(reserve);
    }
    return clientReservesAssoc;
  }

  private async getSumsGroupedByClient(
    clientIds: string[],
    startDate: Date,
  ): Promise<Map<string, Big>> {
    const result = await this.repositories
      .getEntityManager()
      .createQueryBuilder(ReserveEntity)
      .select(['clientId', raw('SUM(amount) as total')])
      .where({
        clientId: clientIds,
        createdAt: {
          $lte: startDate,
        },
      })
      .groupBy('clientId')
      .execute('all', false);
    const clientSumsAssoc = new Map<string, Big>();
    for (const row of result) {
      clientSumsAssoc.set((row as any).client_id, new Big((row as any).total));
    }
    return clientSumsAssoc;
  }

  private async toReportRows({
    clients,
    clientReservesAssoc,
    clientSumsAssoc,
  }: {
    clients: Client[];
    clientReservesAssoc: Map<string, LoadedReserve[]>;
    clientSumsAssoc: Map<string, Big>;
  }): Promise<ReportRow[]> {
    const rows: ReportRow[] = [];
    for (const [clientId, reserves] of clientReservesAssoc) {
      for (const reserve of reserves) {
        const initialSum = clientSumsAssoc.get(clientId) ?? Big(0);
        const row: ReportRow = {
          clientName: '',
          clientDOT: '',
          clientMC: '',
          date: reserve.createdAt,
          type: reserve.reason,
          loadNumber: reserve.reserveInvoice?.invoice?.loadNumber ?? '',
          reserveAmount: reserve.amount,
          reserveBalance: this.calculateSumUntil(reserves, reserve, initialSum),
        };
        const client = clients.find((client) => client.id === clientId);
        if (client) {
          row.clientDOT = client.dot;
          row.clientMC = client.mc;
          row.clientName = client.name;
        }
        rows.push(row);
      }
    }
    return rows;
  }

  private calculateSumUntil(
    reserves: LoadedReserve[],
    reserve: LoadedReserve,
    initialSum: Big,
  ) {
    let sum = initialSum;
    for (const r of reserves) {
      if (r.id === reserve.id) {
        break;
      }
      sum = sum.plus(r.amount);
    }
    return sum;
  }

  private getMetadataRow(request: PortoflioReserveReportRequest): string {
    const startDate = getFormattedDateInBusinessTimezone(request.startDate);
    const endDate = getFormattedDateInBusinessTimezone(request.endDate);
    const ranDate = getFormattedDateInBusinessTimezone(new Date());
    return (
      `Portfolio Reserves Report [${startDate} - ${endDate}]` +
      ` / Date ran: ${ranDate}`
    );
  }
}
