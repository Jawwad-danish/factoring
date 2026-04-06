import {
  getDateInBusinessTimezone,
  getFormattedDateInBusinessTimezone,
} from '@core/date-time';
import { ClientListReportRequest } from '@fs-bobtail/factoring/data';
import { raw } from '@mikro-orm/core';
import { Client, ClientService } from '@module-clients';
import {
  ClientFactoringConfigsEntity,
  ClientFactoringStatus,
  InvoiceEntity,
  RecordStatus,
  ReportName,
} from '@module-persistence/entities';
import { Repositories } from '@module-persistence/repositories';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import Big from 'big.js';
import { Readable } from 'stream';
import { ClientListReportCommand } from '../../client-list-report.command';
import { ReportHandler } from '../report-handler';

interface InvoiceRelatedData {
  sumOfLast30Days: Big;
  sumOfLast12Months: Big;
  firstInvoiceDate?: Date;
  lastInvoiceDate?: Date;
}

interface ReportRow {
  registered: Date;
  ownerName: string;
  clientName?: string;
  clientDOT?: string;
  clientMC?: string;
  accountManagerName: string;
  clientLimit: Big;
  numberOfTrucks: number;
  languages: string;
  firstInvoiceDate?: Date;
  lastInvoiceDate?: Date;
  sumOfLast30Days: Big;
  sumOfLast12Months: Big;
  status: ClientFactoringStatus;
  phoneNumber: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  authorityDate?: Date;
}

@CommandHandler(ClientListReportCommand)
export class ClientListReportCommandHandler
  implements ICommandHandler<ClientListReportCommand, Readable>
{
  constructor(
    private readonly reportHandler: ReportHandler,
    private readonly repositories: Repositories,
    private readonly clientService: ClientService,
  ) {}

  async execute({ request }: ClientListReportCommand): Promise<Readable> {
    const dataStream = await this.getReportDataStream(request);
    return this.reportHandler.processReport<ReportRow>(
      request.outputType,
      ReportName.ClientList,
      dataStream,
      {
        formatDefinition: {
          clientName: { type: 'string', label: 'Client Name' },
          accountManagerName: { type: 'string', label: 'Account Manager' },
          registered: { type: 'string', label: 'Registered' },
          ownerName: { type: 'string', label: 'Owner Name' },
          firstInvoiceDate: { type: 'date', label: 'Start Date' },
          lastInvoiceDate: { type: 'date', label: 'Last Invoice Date' },
          authorityDate: { type: 'date', label: 'Authority Date' },
          numberOfTrucks: { type: 'number', label: 'Number of Trucks' },
          clientLimit: { type: 'currency', label: 'Client Limit' },
          clientMC: { type: 'string', label: 'Client MC' },
          clientDOT: { type: 'string', label: 'Client DOT' },
          languages: { type: 'string', label: 'Languages' },
          sumOfLast30Days: { type: 'currency', label: 'Last 30 Days' },
          sumOfLast12Months: {
            type: 'currency',
            label: 'Last 12 Months',
          },
          status: { type: 'string', label: 'Status' },
          phoneNumber: { type: 'string', label: 'Phone Number' },
          email: { type: 'string', label: 'Email' },
          address: { type: 'string', label: 'Address' },
          city: { type: 'string', label: 'City' },
          state: { type: 'string', label: 'State' },
          zipcode: { type: 'string', label: 'Zipcode' },
        },
        metadataRow: this.getMetadataRow(request),
      },
    );
  }

  async getReportDataStream(
    request: ClientListReportRequest,
  ): Promise<Readable> {
    const clientIds = await this.getClientIds(request);
    const clients = await this.clientService.findByIds(clientIds);
    const clientSums = await this.getInvoiceRelatedData(clientIds);
    const rows = await this.toReportRows({
      clients,
      clientSums,
    });
    return Readable.from(rows, {
      objectMode: true,
    });
  }

  private async getClientIds({
    endDate,
  }: ClientListReportRequest): Promise<string[]> {
    const configs = await this.repositories.getEntityManager().find(
      ClientFactoringConfigsEntity,
      {
        createdAt: {
          $lte: endDate,
        },
      },
      {
        fields: ['clientId'],
      },
    );
    return configs.map((config) => config.clientId);
  }

  private async getInvoiceRelatedData(
    clientIds: string[],
  ): Promise<Map<string, InvoiceRelatedData>> {
    const invoiceData = new Map<string, InvoiceRelatedData>();

    const invoicesSumsPromise = await this.repositories.invoice
      .queryBuilder('i')
      .select([
        'i.client_id',
        raw(
          `SUM(case when i.created_at >= NOW() - interval '30 days' then i.accounts_receivable_value else 0 end) as last_30_days,
      SUM(case when i.created_at >= NOW() - interval '12 months' then i.accounts_receivable_value else 0 end) as last_12_months`,
        ),
      ])
      .where({
        recordStatus: RecordStatus.Active,
        clientId: { $in: clientIds },
      })
      .groupBy('clientId')
      .execute('all', false);

    const firstAndLastInvoicesPromise = this.repositories
      .getEntityManager()
      .createQueryBuilder(InvoiceEntity)
      .select([
        'clientId',
        raw('MIN(created_at) as first_date'),
        raw('MAX(created_at) as last_date'),
      ])
      .where({
        clientId: { $in: clientIds },
      })
      .groupBy('clientId')
      .execute('all', false);

    const [invoicesSumsGroupBy, firstAndLastInvoicesGroupBy] =
      (await Promise.all([
        invoicesSumsPromise,
        firstAndLastInvoicesPromise,
      ])) as any[];

    for (const clientId of clientIds) {
      const clientSums = invoicesSumsGroupBy?.find(
        (s) => s.client_id === clientId,
      );

      const firstAndLastInvoice = firstAndLastInvoicesGroupBy?.find(
        (i) => i.client_id === clientId,
      );

      invoiceData.set(clientId, {
        sumOfLast30Days: Big((clientSums as any)?.last_30_days || 0),
        sumOfLast12Months: Big((clientSums as any)?.last_12_months || 0),
        firstInvoiceDate: (firstAndLastInvoice as any)?.first_date
          ? new Date((firstAndLastInvoice as any).first_date)
          : undefined,
        lastInvoiceDate: (firstAndLastInvoice as any)?.last_date
          ? new Date((firstAndLastInvoice as any).last_date)
          : undefined,
      });
    }
    return invoiceData;
  }

  private async toReportRows({
    clients,
    clientSums,
  }: {
    clients: Client[];
    clientSums: Map<string, InvoiceRelatedData>;
  }): Promise<ReportRow[]> {
    const rows: ReportRow[] = [];
    for (const client of clients) {
      const invoiceData = clientSums.get(client.id);
      const row: ReportRow = {
        authorityDate: client.authorityDate
          ? getDateInBusinessTimezone(client.authorityDate).toDate()
          : undefined,
        status: client.factoringConfig.status,
        clientLimit: client.factoringConfig.clientLimitAmount || Big(0),
        numberOfTrucks: client.factoringConfig.totalTrucksAmount,
        languages: client.languages?.join(', ') || '',
        firstInvoiceDate: invoiceData?.firstInvoiceDate || undefined,
        lastInvoiceDate: invoiceData?.lastInvoiceDate || undefined,
        sumOfLast30Days: invoiceData?.sumOfLast30Days || Big(0),
        sumOfLast12Months: invoiceData?.sumOfLast12Months || Big(0),
        registered: client.createdAt,
        ownerName: client.getOwnerContact()?.name || 'N/A',
        clientDOT: client.dot,
        clientMC: client.mc,
        clientName: client.name,
        email: client.email,
        accountManagerName: client.factoringConfig.clientSuccessTeam.name,
        phoneNumber:
          client.getPrimaryContact()?.getPhoneNumber() ||
          client.getBusinessContact()?.getPhoneNumber() ||
          'N/A',
        address:
          client.getPrimaryContact()?.getAddress() ||
          client.getBusinessContact()?.getAddress() ||
          'N/A',
        city:
          client.getPrimaryContact()?.getCity() ||
          client.getBusinessContact()?.getCity() ||
          'N/A',
        state:
          client.getPrimaryContact()?.getState() ||
          client.getBusinessContact()?.getState() ||
          'N/A',
        zipcode:
          client.getPrimaryContact()?.getZipcode() ||
          client.getBusinessContact()?.getZipcode() ||
          'N/A',
      };
      rows.push(row);
    }
    return rows;
  }

  private getMetadataRow(request: ClientListReportRequest): string {
    const forDate = getFormattedDateInBusinessTimezone(request.endDate);
    const ranDate = getFormattedDateInBusinessTimezone(new Date());
    return `Client List Report  ${forDate}` + ` / Date ran: ${ranDate}`;
  }
}
