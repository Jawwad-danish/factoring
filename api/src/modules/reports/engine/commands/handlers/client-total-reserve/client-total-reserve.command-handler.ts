import { getFormattedDateInBusinessTimezone } from '@core/date-time';
import { TypedTransform } from '@core/util';
import { ClientTotalReserveReportCreateRequest } from '@fs-bobtail/factoring/data';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Readable } from 'stream';
import { ReportName } from '../../../../../persistence';
import { ReportsDataAccess } from '../../../reports.data-access';
import { ClientTotalReserveReportCommand } from '../../client-total-reserve.command';
import { ReportHandler } from '../report-handler';

interface ClientTotalReserveReportData {
  clientId: string;
  total: number;
}

class ClientTotalReserveTransformer extends TypedTransform<
  any,
  ClientTotalReserveReportData
> {
  doTransform(chunk: any): ClientTotalReserveReportData {
    return {
      clientId: chunk.client_id,
      total: chunk.total,
    };
  }
}

@CommandHandler(ClientTotalReserveReportCommand)
export class ClientTotalReserveReportCommandHandler
  implements ICommandHandler<ClientTotalReserveReportCommand, Readable>
{
  constructor(
    private readonly reportHandler: ReportHandler,
    private readonly reportsDataAccess: ReportsDataAccess,
  ) {}

  getName(): ReportName {
    return ReportName.ClientTotalReserve;
  }

  async execute(command: ClientTotalReserveReportCommand): Promise<Readable> {
    const dataStream = await this.getReportDataStream(command.request);
    return this.reportHandler.processReport<ClientTotalReserveReportData>(
      command.request.outputType,
      this.getName(),
      dataStream,
      {
        formatDefinition: {
          clientId: { type: 'string' },
          total: { type: 'currency' },
        },
        metadataRow: this.getMetadataRow(),
      },
    );
  }

  async getReportDataStream(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _params: ClientTotalReserveReportCreateRequest,
  ): Promise<Readable> {
    try {
      const stream = await this.reportsDataAccess.getClientTotalReserve();
      return stream.pipeline(new ClientTotalReserveTransformer());
    } catch (error) {
      throw error;
    }
  }

  private getMetadataRow(): string {
    const ranDate = getFormattedDateInBusinessTimezone(new Date());
    return `Client Total Reserve Report / Date ran: ${ranDate}`;
  }
}
