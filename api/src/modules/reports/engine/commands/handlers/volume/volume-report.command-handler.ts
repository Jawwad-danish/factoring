import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { VolumeReportCommand } from '../../volume-report.command';
import { Readable } from 'stream';
import { ReportName } from '@module-persistence/entities';
import { ReportHandler } from '../report-handler';
import { ReportsDataAccess } from '../../../reports.data-access';
import { ClientApi, LightweightClient } from '@module-clients';
import { VolumeReportData } from './data';
import { getFormattedDateInBusinessTimezone } from '@core/date-time';
import { VolumeReportRequest } from '@fs-bobtail/factoring/data';
import { VolumeReportDataTransformer } from './volume-report.data-transformer';

@CommandHandler(VolumeReportCommand)
export class VolumeReportCommandHandler
  implements ICommandHandler<VolumeReportCommand, Readable>
{
  constructor(
    private readonly reportHandler: ReportHandler,
    private readonly reportsDataAccess: ReportsDataAccess,
    private readonly clientApi: ClientApi,
  ) {}

  getName(): ReportName {
    return ReportName.Volume;
  }

  async execute(command: VolumeReportCommand): Promise<Readable> {
    const dataStream = await this.getReportDataStream(command.request);
    return this.reportHandler.processReport<VolumeReportData>(
      command.request.outputType,
      this.getName(),
      dataStream,
      {
        formatDefinition: {
          clientName: { type: 'string', label: 'Client' },
          accountManagerName: { type: 'string', label: 'Account Manager' },
          clientMC: { type: 'string', label: 'Client MC' },
          clientDOT: { type: 'string', label: 'Client DOT' },
          salesperson: { type: 'string', label: 'Salesperson' },
          totalInvoices: {
            type: 'currency',
            label: 'Total Invoices Purchased',
          },
          totalFees: { type: 'currency', label: 'Total Fees' },
        },
        metadataRow: this.getMetadataRow(command.request),
      },
    );
  }

  async getReportDataStream(request: VolumeReportRequest): Promise<Readable> {
    const clients = await this.clientApi.getAllClients();

    const invoiceDataMap =
      await this.reportsDataAccess.getVolumeReportInvoiceData(
        request.startDate,
        request.endDate,
      );

    const clientDataMap = new Map<string, LightweightClient>();
    clients.forEach((client) => {
      clientDataMap.set(client.id, client);
    });

    const factoringConfigStream =
      await this.reportsDataAccess.getAllClientFactoringConfigsWithTeamDataStream();

    const dataStream = factoringConfigStream.pipeline(
      new VolumeReportDataTransformer(clientDataMap, invoiceDataMap),
    );
    return dataStream;
  }

  private getMetadataRow(request: VolumeReportRequest): string {
    const startDate = getFormattedDateInBusinessTimezone(request.startDate);
    const endDate = getFormattedDateInBusinessTimezone(request.endDate);
    const ranDate = getFormattedDateInBusinessTimezone(new Date());

    return (
      `Volume Report ${startDate} to ${endDate}` + ` / Date ran: ${ranDate}`
    );
  }
}
