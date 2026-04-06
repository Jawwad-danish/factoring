import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BrokerRatingReportCommand } from '../../broker-rating-report.command';
import { Readable } from 'stream';
import { ReportHandler } from '../report-handler';
import { BrokerApi } from '@module-brokers';
import { FormatDefinition } from '../../../serialization/serialization-options';
import {
  BrokerFactoringConfigRepository,
  ReportName,
} from '@module-persistence';
import { getFormattedDateInBusinessTimezone } from '@core/date-time';
import { Logger } from '@nestjs/common';
import Big from 'big.js';

interface ReportRow {
  brokerName: string;
  brokerMC: string;
  brokerDOT: string;
  brokerStatus: string;
  brokerLimit: Big;
  rating: string;
  externalRating: string;
  displayRating: string;
  authorityDate: Date;
}

@CommandHandler(BrokerRatingReportCommand)
export class BrokerRatingReportCommandHandler
  implements ICommandHandler<BrokerRatingReportCommand, Readable>
{
  private readonly logger = new Logger(BrokerRatingReportCommandHandler.name);

  constructor(
    private reportHandler: ReportHandler,
    private brokerApi: BrokerApi,
    private brokerFactoringConfigRepository: BrokerFactoringConfigRepository,
  ) {}

  async execute({ request }: BrokerRatingReportCommand): Promise<Readable> {
    const dataStream = await this.getReportDataStream();
    const formatDefinition: FormatDefinition<ReportRow> = {
      brokerName: { type: 'string', label: 'Broker' },
      brokerMC: { type: 'string', label: 'MC' },
      brokerDOT: { type: 'string', label: 'DOT' },
      externalRating: { type: 'string', label: 'External Rating' },
      rating: { type: 'string', label: 'Rating' },
      displayRating: { type: 'string', label: 'Display Rating' },
      authorityDate: { type: 'date', label: 'Authority Date' },
      brokerStatus: { type: 'string', label: 'Status' },
      brokerLimit: { type: 'currency', label: 'Broker Limit' },
    };

    return this.reportHandler.processReport<ReportRow>(
      request.outputType,
      ReportName.BrokerRating,
      dataStream,
      {
        formatDefinition,
        metadataRow: this.getMetadataRow(),
      },
    );
  }

  private async getReportDataStream(): Promise<Readable> {
    this.logger.log(`Fetching data for ${ReportName.BrokerRating}...`);

    const [brokerConfigs] =
      await this.brokerFactoringConfigRepository.findAll();

    if (brokerConfigs.length === 0) {
      return Readable.from([], { objectMode: true });
    }

    const brokerIds = brokerConfigs.map((config) => config.brokerId);
    const brokerLimitMap = new Map<string, Big | null>(
      brokerConfigs.map((config) => [config.brokerId, config.limitAmount]),
    );

    const brokers = await this.brokerApi.findByIds(brokerIds);

    const rows: ReportRow[] = brokers.map((broker) => ({
      brokerName: broker.legalName,
      brokerMC: broker.mc,
      brokerDOT: broker.dot,
      brokerStatus: broker.status,
      brokerLimit: brokerLimitMap.get(broker.id) ?? new Big(0),
      rating: broker.rating,
      externalRating: broker.externalRating,
      displayRating: broker.displayRating(),
      authorityDate: broker.authorityDate,
    }));

    return Readable.from(rows, { objectMode: true });
  }

  private getMetadataRow(): string {
    const now = getFormattedDateInBusinessTimezone(new Date());
    const ranDate = getFormattedDateInBusinessTimezone(new Date());
    return `Broker Rating Report ${now} / Date ran: ${ranDate}`;
  }
}
