import { TypedReadable } from '@core/util';
import { ApprovedAgingReportCreateRequest } from '@fs-bobtail/factoring/data';
import { S3ObjectLocator } from '@module-aws';
import { BrokerService } from '@module-brokers';
import { ClientService } from '@module-clients';
import { ReportName } from '@module-persistence/entities';
import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Readable } from 'stream';
import { ReportsDataAccess } from '../../../reports.data-access';
import { ReportSerializerOptions } from '../../../serialization';
import { ApprovedAgingReportCommand } from '../../approved-aging-report.command';
import { ReportHandler } from '../report-handler';
import { ApprovedAgingDataTransformer } from './approved-aging.data-transformer';
import {
  ApprovedAgingData,
  BrokerLite,
  ClientLite,
  ClientsAndBrokersMapping,
} from './data';
import { QueryCriteria } from '@core/data';
import { plainToInstance } from 'class-transformer';

@CommandHandler(ApprovedAgingReportCommand)
export class ApprovedAgingReportCommandHandler
  implements ICommandHandler<ApprovedAgingReportCommand, Readable>
{
  private readonly logger = new Logger(ApprovedAgingReportCommandHandler.name);

  constructor(
    private readonly reportHandler: ReportHandler,
    private readonly reportsDataAccess: ReportsDataAccess,
    private readonly clientService: ClientService,
    private readonly brokerService: BrokerService,
  ) {}

  getName(): ReportName {
    return ReportName.ApprovedAging;
  }

  getHumanReadableName(): string {
    return 'Approved Aging';
  }

  async execute(command: ApprovedAgingReportCommand): Promise<Readable> {
    const dataStream = await this.getReportDataStream(command.request);
    return this.reportHandler.processReport(
      command.request.outputType,
      this.getName(),
      dataStream,
      this.getSerializerOptions(),
    );
  }

  private async getReportDataStream(
    params: ApprovedAgingReportCreateRequest,
  ): Promise<TypedReadable<ApprovedAgingData>> {
    this.logger.log(`Fetching and enriching data for ${this.getName()}...`);
    try {
      const queryCriteria = plainToInstance(QueryCriteria, params.criteria);

      const rawDataStream = await this.reportsDataAccess.getApprovedAging(
        queryCriteria,
      );
      const { clientIds, brokerIds } =
        await this.reportsDataAccess.getClientsAndBrokersForFilter(
          queryCriteria,
        );

      const mapping = await this.getMapping(clientIds, brokerIds);

      const dataStream = rawDataStream.pipeline(
        new ApprovedAgingDataTransformer(mapping),
      );

      return dataStream;
    } catch (error) {
      this.logger.error(
        `Failed to initiate data stream for ${this.getName()}: ${
          error.message
        }`,
        error.stack,
      );
      throw error;
    }
  }

  getSerializerOptions(): ReportSerializerOptions<ApprovedAgingData> {
    return {
      formatDefinition: {
        createdAt: {
          type: 'date',
          label: 'Date',
        },
        clientName: {
          type: 'string',
          label: 'Client',
        },
        brokerName: {
          type: 'string',
          label: 'Broker',
        },
        displayId: {
          type: 'string',
          label: 'Invoice #',
        },
        loadNumber: {
          type: 'string',
          label: 'Load #',
        },
        arValue: {
          type: 'currency',
          label: 'Approved A/R',
          options: {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          },
        },
        lineHaulRate: {
          type: 'currency',
          label: 'Invoice Amount',
          options: {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          },
        },
      },
      metadataRow: 'Approved Aging Report',
    };
  }

  getHtmlTemplateLocator(): S3ObjectLocator {
    return new S3ObjectLocator('bucket', 'key');
  }

  private async getMapping(
    clientIds: string[],
    brokerIds: string[],
  ): Promise<ClientsAndBrokersMapping> {
    const clientsMapping = new Map<string, ClientLite>();
    const brokersMapping = new Map<string, BrokerLite>();

    this.logger.debug('Fetching clients...');
    const clients = await this.clientService.findByIds(clientIds);
    for (const client of clients) {
      clientsMapping.set(client.id, {
        id: client.id,
        name: client.name,
        mc: client.mc,
      });
    }
    this.logger.debug('Fetching brokers...');
    const brokers = await this.brokerService.findByIds(brokerIds);
    for (const broker of brokers) {
      brokersMapping.set(broker.id, {
        id: broker.id,
        legalName: broker.legalName,
        mc: broker.mc,
      });
    }

    return { clients: clientsMapping, brokers: brokersMapping };
  }
}
