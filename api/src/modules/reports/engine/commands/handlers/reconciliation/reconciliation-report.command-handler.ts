import { getFormattedDateInBusinessTimezone } from '@core/date-time';
import { Client, ClientService } from '@module-clients';
import {
  BasicEntitySchema,
  RecordStatus,
  ReportName,
  ReserveEntity,
  ReserveReason,
  TagDefinitionKey,
} from '@module-persistence/entities';
import { Repositories } from '@module-persistence/repositories';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import Big from 'big.js';
import { Readable } from 'stream';
import {
  PortfolioReportRequest,
  ReconciliationReportRequest,
} from '@fs-bobtail/factoring/data';
import { ReportHandler } from '../report-handler';
import { ReconciliationReportCommand } from '../../reconciliation-report.command';
import dayjs from 'dayjs';
import { Arrays } from '@core/util';

interface ReportRow {
  clientId: string;
  clientName: string;
  accountManagerName: string;
  clientMC: string;
  clientDOT: string;
  amount: Big;
  date: string;
  reason: string;
  nonPaymentReason: string;
}

type ReportData = {
  reserves: ReserveEntity[];
  clients: Client[];
  nonPaymentReasonsMap: Record<string, string>;
};

@CommandHandler(ReconciliationReportCommand)
export class ReconciliationReportCommandHandler
  implements ICommandHandler<ReconciliationReportCommand, Readable>
{
  constructor(
    private readonly reportHandler: ReportHandler,
    private readonly repositories: Repositories,
    private readonly clientService: ClientService,
  ) {}

  async execute({ request }: ReconciliationReportCommand): Promise<Readable> {
    const dataStream = await this.getReportDataStream(request);
    return this.reportHandler.processReport<ReportRow>(
      request.outputType,
      ReportName.Reconciliation,
      dataStream,
      {
        formatDefinition: {
          clientId: { type: 'string', label: 'Client ID' },
          clientName: { type: 'string', label: 'Client Name' },
          accountManagerName: { type: 'string', label: 'Account Manager' },
          clientMC: { type: 'string', label: 'Client MC' },
          clientDOT: { type: 'string', label: 'Client DOT' },
          amount: { type: 'currency', label: 'Amount' },
          date: { type: 'string', label: 'Date' },
          reason: { type: 'string', label: 'Reason' },
          nonPaymentReason: { type: 'string', label: 'Nonpayment reason' },
        },
        metadataRow: this.getMetadataRow(request),
      },
    );
  }

  async getReportDataStream(
    request: PortfolioReportRequest,
  ): Promise<Readable> {
    const reportData = await this.getReportData(request);
    const rows = this.toReportRows(reportData);
    return Readable.from(rows, {
      objectMode: true,
    });
  }

  private async getReportData(
    request: PortfolioReportRequest,
  ): Promise<ReportData> {
    const reserves = await this.repositories.reserve
      .readOnlyQueryBuilder('r')
      .leftJoinAndSelect('r.reserveInvoice', 'ri')
      .leftJoinAndSelect('ri.invoice', 'i')
      .leftJoinAndSelect('i.tags', 't', {
        [`t.${BasicEntitySchema.COLUMN_RECORD_STATUS}`]: RecordStatus.Active,
      })
      .leftJoinAndSelect('t.tagDefinition', 'td', {
        [`td.${BasicEntitySchema.COLUMN_RECORD_STATUS}`]: RecordStatus.Active,
      })
      .where({
        [`r.${BasicEntitySchema.COLUMN_CREATED_AT}`]: {
          $gte: request.startDate,
          $lte: request.endDate,
        },
        [`r.${BasicEntitySchema.COLUMN_RECORD_STATUS}`]: RecordStatus.Active,
      })
      .getResultList();
    const clientIds = Arrays.uniqueNotNull(
      reserves,
      (reserve) => reserve.clientId,
    );
    const clients = await this.clientService.findByIds(clientIds);
    const nonPaymentReasonsMap: Record<string, string> = {};
    reserves.forEach((reserve) => {
      if (reserve.reason === ReserveReason.NonPayment) {
        const nonPaymentReasonTag = reserve.reserveInvoice?.invoice?.tags
          .getItems()
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .find((tag) =>
            [
              TagDefinitionKey.MISSING_DOCUMENT,
              TagDefinitionKey.DUPLICATE_INVOICE,
              TagDefinitionKey.BROKER_PAID_CLIENT_DIRECTLY,
              TagDefinitionKey.BROKER_CLAIM_AGAINST_CLIENT,
              TagDefinitionKey.LOAD_NOT_DELIVERED,
              TagDefinitionKey.DOUBLED_BROKERED_LOAD,
              TagDefinitionKey.BROKER_PAID_PREVIOUS_FACTOR,
              TagDefinitionKey.FILED_ON_BROKER_BOND,
            ].includes(tag.tagDefinition.key),
          );
        nonPaymentReasonsMap[reserve.id] =
          nonPaymentReasonTag?.tagDefinition.name || '';
      }
    });
    return {
      reserves,
      clients,
      nonPaymentReasonsMap,
    };
  }

  private toReportRows(reportData: ReportData): ReportRow[] {
    const rows: ReportRow[] = [];
    for (const reserve of reportData.reserves) {
      const client = reportData.clients.find(
        (client) => client.id === reserve.clientId,
      );
      if (!client) {
        throw new Error(`Client not found for reserve ID: ${reserve.id}`);
      }
      const nonPaymentReason =
        reportData.nonPaymentReasonsMap[reserve.id] ?? '';
      const row: ReportRow = {
        clientId: reserve.clientId,
        clientName: client.name,
        accountManagerName: client.factoringConfig.clientSuccessTeam.name,
        clientMC: client.mc,
        clientDOT: client.dot,
        amount: reserve.amount,
        date: dayjs(reserve.createdAt).format('MM/DD/YYYY hh:mm:ss A'),
        reason: reserve.reason,
        nonPaymentReason: nonPaymentReason,
      };
      rows.push(row);
    }
    return rows;
  }

  private getMetadataRow(request: ReconciliationReportRequest): string {
    const startDate = getFormattedDateInBusinessTimezone(request.startDate);
    const endDate = getFormattedDateInBusinessTimezone(request.endDate);
    const ranDate = getFormattedDateInBusinessTimezone(new Date());
    return `Reconciliation Report ${
      request.title ?? `[${startDate} - ${endDate}]`
    } / Date ran: ${ranDate}`;
  }
}
