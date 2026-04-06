import { getFormattedDateInBusinessTimezone } from '@core/date-time';
import { DetailedAgingReportCreateRequest } from '@fs-bobtail/factoring/data';
import { BrokerApi, LightweightBroker } from '@module-brokers';
import { ClientApi, LightweightClient } from '@module-clients';
import { RecordStatus, ReportName } from '@module-persistence/entities';
import { Repositories } from '@module-persistence/repositories';
import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import Big from 'big.js';
import { Readable } from 'stream';
import { ReportsDataAccess } from '../../../reports.data-access';
import { DetailedAgingReportCommand } from '../../detailed-aging.command';
import { ReportHandler } from '../report-handler';
import {
  DetailedAgingClientData,
  DetailedAgingDataTransformer,
  LightweightClientsAndBrokersMapping,
} from './detailed-aging.data-transformer';

interface ReportRow {
  purchasedDate: Date;
  clientName: string;
  accountManager: string;
  clientMC: string;
  clientDOT: string;
  brokerName: string;
  brokerMC: string;
  brokerDOT: string;
  loadNumber: string;
  accountsReceivableValue: Big;
  approvedFactorFee: Big;
  deduction: Big;
  reserveFee: Big;
  fundedValue: null | Big;
}

@CommandHandler(DetailedAgingReportCommand)
export class DetailedAgingReportCommandHandler
  implements ICommandHandler<DetailedAgingReportCommand, Readable>
{
  private readonly logger = new Logger(DetailedAgingReportCommandHandler.name);

  constructor(
    private readonly reportHandler: ReportHandler,
    private readonly reportsDataAccess: ReportsDataAccess,
    private readonly repositories: Repositories,
    private readonly clientApi: ClientApi,
    private readonly brokerApi: BrokerApi,
  ) {}

  async execute({ request }: DetailedAgingReportCommand): Promise<Readable> {
    const dataStream = await this.getReportDataStream(request);
    return this.reportHandler.processReport<ReportRow>(
      request.outputType,
      ReportName.DetailedAging,
      dataStream,
      {
        formatDefinition: {
          purchasedDate: { type: 'date', label: 'Purchased Date' },
          clientName: { type: 'string', label: 'Client' },
          accountManager: { type: 'string', label: 'Account Manager' },
          clientMC: { type: 'string', label: 'Client MC' },
          clientDOT: { type: 'string', label: 'Client DOT' },
          brokerName: { type: 'string', label: 'Debtor' },
          brokerMC: { type: 'string', label: 'Broker MC' },
          brokerDOT: { type: 'string', label: 'Broker DOT' },
          loadNumber: { type: 'string', label: 'Load #' },
          accountsReceivableValue: { type: 'currency', label: 'Amount' },
          approvedFactorFee: { type: 'currency', label: 'Fees' },
          deduction: { type: 'currency', label: 'Chargeback' },
          reserveFee: { type: 'currency', label: 'Reserve Fee' },
          fundedValue: { type: 'currency', label: 'Funded' },
        },
        metadataRow: this.getMetadataRow(request),
      },
    );
  }

  async getReportDataStream(
    request: DetailedAgingReportCreateRequest,
  ): Promise<Readable> {
    this.logger.log(
      `Fetching and enriching data for ${ReportName.DetailedAging}...`,
    );
    try {
      const rawDataStream = await this.reportsDataAccess.getDetailedAging(
        request.date,
      );

      const [clients, brokers] = await Promise.all([
        this.clientApi.getAllClients(),
        this.brokerApi.getAllBrokers(),
      ]);
      const mapping = await this.createClientsAndBrokersMapping(
        clients,
        brokers,
      );
      const dataStream = rawDataStream.pipeline(
        new DetailedAgingDataTransformer(mapping),
      );

      return dataStream;
    } catch (error) {
      this.logger.error(
        `Failed to initiate data stream for ${ReportName.DetailedAging}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async createClientsAndBrokersMapping(
    clients: LightweightClient[],
    brokers: LightweightBroker[],
  ): Promise<LightweightClientsAndBrokersMapping> {
    const clientsMap = new Map<string, DetailedAgingClientData>();
    const brokersMap = new Map<string, LightweightBroker>();

    const clientIds = clients.map((c) => c.id);
    const succesTeamNameMap = await this.createClientSuccessTeamMapping(
      clientIds,
    );

    for (const client of clients) {
      clientsMap.set(client.id, {
        ...client,
        clientSuccessTeam: succesTeamNameMap.get(client.id),
      });
    }

    brokers.forEach((broker) => brokersMap.set(broker.id, broker));
    return { clients: clientsMap, brokers: brokersMap };
  }

  private async createClientSuccessTeamMapping(clientIds: string[]) {
    const clientSuccessTeamMapping = new Map<string, string>();
    const result = await this.repositories.clientFactoringConfig
      .readOnlyQueryBuilder('cfc')
      .select(['cfc.client_id', 'cst.name'])
      .leftJoin('cfc.clientSuccessTeam', 'cst')
      .where({
        clientId: { $in: clientIds },
        recordStatus: RecordStatus.Active,
      })
      .execute('all', false);

    for (const row of result) {
      clientSuccessTeamMapping.set(row['client_id'], row['name']);
    }
    return clientSuccessTeamMapping;
  }

  private getMetadataRow(request: DetailedAgingReportCreateRequest): string {
    const forDate = getFormattedDateInBusinessTimezone(request.date);
    const ranDate = getFormattedDateInBusinessTimezone(new Date());
    return `Detailed Aging Report ${forDate}` + ` / Date ran: ${ranDate}`;
  }
}
