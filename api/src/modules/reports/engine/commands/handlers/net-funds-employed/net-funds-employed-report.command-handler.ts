import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Readable } from 'stream';
import { ReportName } from '../../../../../persistence';
import { NetFundsEmployedReportRequest } from '@fs-bobtail/factoring/data';
import { ReportsDataAccess } from '../../../reports.data-access';
import { NetFundsEmployedReportCommand } from '../../net-funds-employed-report.command';
import { ReportHandler } from '../report-handler';
import { getFormattedDateInBusinessTimezone } from '@core/date-time';
import { ClientApi } from '@module-clients';
import { NetFundsEmployedReportData } from './data';
import { NetFundsEmployedDataTransformer } from './net-funds-employed.data-transformer';

@CommandHandler(NetFundsEmployedReportCommand)
export class NetFundsEmployedReportCommandHandler
  implements ICommandHandler<NetFundsEmployedReportCommand, Readable>
{
  constructor(
    private readonly reportHandler: ReportHandler,
    private readonly reportsDataAccess: ReportsDataAccess,
    private readonly clientApi: ClientApi,
  ) {}

  getName(): ReportName {
    return ReportName.NetFundsEmployed;
  }

  async execute(command: NetFundsEmployedReportCommand): Promise<Readable> {
    const dataStream = await this.getReportDataStream(command.request);
    return this.reportHandler.processReport<NetFundsEmployedReportData>(
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
          nfe: { type: 'currency', label: 'NFE' },
          fees: { type: 'currency', label: 'Fees' },
        },
        metadataRow: this.getMetadataRow(command.request),
      },
    );
  }

  async getReportDataStream(
    request: NetFundsEmployedReportRequest,
  ): Promise<Readable> {
    const rawDataStream = await this.reportsDataAccess.getClientAgingByData(
      request.date,
    );
    const clients = await this.clientApi.getAllClients();

    const dataStream = rawDataStream.pipeline(
      new NetFundsEmployedDataTransformer(clients),
    );
    return dataStream;
  }

  private getMetadataRow(request: NetFundsEmployedReportRequest): string {
    const forDate = getFormattedDateInBusinessTimezone(request.date);
    const ranDate = getFormattedDateInBusinessTimezone(new Date());

    return `Net Funds Employed Report ${forDate} / Date ran: ${ranDate}`;
  }
}
