import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Readable } from 'stream';
import { ReportName } from '../../../../../persistence';
import { ClientAgingReportRequest } from '@fs-bobtail/factoring/data';
import { ReportsDataAccess } from '../../../reports.data-access';
import { ClientAgingReportCommand } from '../../client-aging-report.command';
import { ReportHandler } from '../report-handler';
import { getFormattedDateInBusinessTimezone } from '@core/date-time';
import { ClientApi } from '@module-clients';
import { ClientAgingReportData } from './data';
import {
  ClientAgingDataTransformer,
  ClientData,
} from './client-aging.data-transformer';
import { Repositories } from '@module-persistence/repositories';
import { RecordStatus } from '@module-persistence/entities';

@CommandHandler(ClientAgingReportCommand)
export class ClientAgingReportCommandHandler
  implements ICommandHandler<ClientAgingReportCommand, Readable>
{
  constructor(
    private readonly reportHandler: ReportHandler,
    private readonly reportsDataAccess: ReportsDataAccess,
    private readonly clientApi: ClientApi,
    private readonly repositories: Repositories,
  ) {}

  getName(): ReportName {
    return ReportName.ClientAging;
  }

  async execute(command: ClientAgingReportCommand): Promise<Readable> {
    const dataStream = await this.getReportDataStream(command.request);
    return this.reportHandler.processReport<ClientAgingReportData>(
      command.request.outputType,
      this.getName(),
      dataStream,
      {
        formatDefinition: {
          clientName: { type: 'string', label: 'Client' },
          clientMC: { type: 'string', label: 'Client MC' },
          clientDOT: { type: 'string', label: 'Client DOT' },
          accountManagerName: { type: 'string', label: 'Account Manager' },
          zeroToThirtyAging: { type: 'currency', label: '0-30' },
          thirtyOneToSixtyAging: { type: 'currency', label: '31-60' },
          sixtyOneToNinetyAging: { type: 'currency', label: '61-90' },
          ninetyPlusAging: { type: 'currency', label: '91+' },
          totalInvoices: { type: 'currency', label: 'Total Invoices' },
          fees: { type: 'currency', label: 'Fees' },
        },
        metadataRow: this.getMetadataRow(command.request),
      },
    );
  }

  async getReportDataStream(
    request: ClientAgingReportRequest,
  ): Promise<Readable> {
    const rawDataStream = await this.reportsDataAccess.getClientAgingByData(
      request.date,
    );
    const clients = await this.clientApi.getAllClients();
    const clientSuccessTeams = await this.getClientSuccessTeams();

    const enrichedClients: ClientData[] = clients.map((client) => ({
      ...client,
      clientSuccessTeam: clientSuccessTeams.get(client.id) || 'N/A',
    }));

    const dataStream = rawDataStream.pipeline(
      new ClientAgingDataTransformer(enrichedClients),
    );
    return dataStream;
  }

  private async getClientSuccessTeams(): Promise<Map<string, string>> {
    const factoringConfigs = await this.repositories.clientFactoringConfig
      .readOnlyQueryBuilder('cfc')
      .leftJoinAndSelect('cfc.clientSuccessTeam', 'cst')
      .select(['cfc.client_id', 'cst.name'])
      .where({
        recordStatus: RecordStatus.Active,
      })
      .execute('all', false);

    const map = new Map<string, string>();
    for (const config of factoringConfigs) {
      map.set(config['client_id'], config['name']);
    }
    return map;
  }

  private getMetadataRow(request: ClientAgingReportRequest): string {
    const forDate = getFormattedDateInBusinessTimezone(request.date);
    const ranDate = getFormattedDateInBusinessTimezone(new Date());

    return `Client Aging Report ${forDate} / Date ran: ${ranDate}`;
  }
}
