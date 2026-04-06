import {
  endOfDay,
  getDateInBusinessTimezone,
  getFormattedDateInBusinessTimezone,
  startOfDay,
} from '@core/date-time';
import { BrokerPaymentReportRequest } from '@fs-bobtail/factoring/data';
import { ObjectQuery, QBFilterQuery } from '@mikro-orm/core';
import { Broker, BrokerService } from '@module-brokers';
import { Client, ClientService } from '@module-clients';
import {
  BrokerPaymentEntity,
  BrokerPaymentType,
  RecordStatus,
  ReportName,
} from '@module-persistence/entities';
import { Repositories } from '@module-persistence/repositories';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import Big from 'big.js';
import { Readable } from 'stream';
import { BrokerPaymentReportCommand } from '../../broker-payment-report.command';
import { ReportHandler } from '../report-handler';

interface ReportRow {
  transactionType: string;
  batchDate: Date;
  date: Date;
  clientName?: string;
  accountManagerName: string;
  clientDOT?: string;
  clientMC?: string;
  brokerName?: string;
  brokerMC?: string;
  brokerDOT?: string;
  invoiceLoadNumber: string;
  invoiceNumber: string;
  amount: Big;
  paid: Big;
}

@CommandHandler(BrokerPaymentReportCommand)
export class BrokerPaymentReportCommandHandler
  implements ICommandHandler<BrokerPaymentReportCommand, Readable>
{
  constructor(
    private readonly reportHandler: ReportHandler,
    private readonly repositories: Repositories,
    private readonly clientService: ClientService,
    private readonly brokerService: BrokerService,
  ) {}

  async execute({ request }: BrokerPaymentReportCommand): Promise<Readable> {
    const dataStream = await this.getReportDataStream(request);
    return this.reportHandler.processReport<ReportRow>(
      request.outputType,
      ReportName.BrokerPayment,
      dataStream,
      {
        formatDefinition: {
          transactionType: { type: 'string', label: 'Transaction Type' },
          batchDate: { type: 'date', label: 'Batch Date' },
          date: { type: 'date', label: 'Date' },
          clientName: { type: 'string', label: 'Client Name' },
          accountManagerName: { type: 'string', label: 'Account Manager' },
          clientMC: { type: 'string', label: 'Client MC' },
          clientDOT: { type: 'string', label: 'Client DOT' },
          brokerName: { type: 'string', label: 'Broker Name' },
          brokerMC: { type: 'string', label: 'Broker MC' },
          brokerDOT: { type: 'string', label: 'Broker DOT' },
          invoiceLoadNumber: { type: 'string', label: 'Load #' },
          invoiceNumber: { type: 'string', label: 'Invoice #' },
          amount: { type: 'currency', label: 'Amount' },
          paid: { type: 'currency', label: 'Paid' },
        },
        metadataRow: this.getMetadataRow(request),
      },
    );
  }

  async getReportDataStream(
    request: BrokerPaymentReportRequest,
  ): Promise<Readable> {
    const filter: QBFilterQuery<BrokerPaymentEntity> = this.getDateFilter(
      request.startDate,
      request.endDate,
    );

    filter.recordStatus = RecordStatus.Active;
    const brokerPayments = await this.getBrokerPayments(filter);
    const clientIds = Array.from(
      new Set(brokerPayments.map((bp) => bp.invoice.clientId)),
    );
    const brokerIds = new Set<string>();
    for (const bp of brokerPayments) {
      if (bp.invoice.brokerId) {
        brokerIds.add(bp.invoice.brokerId);
      }
    }

    const clientsPromise = this.clientService.findByIds(clientIds);
    const brokersPromise = this.brokerService.findByIds(Array.from(brokerIds));
    const [clients, brokers] = await Promise.all([
      clientsPromise,
      brokersPromise,
    ]);
    const rows = this.toReportRows({
      brokerPayments,
      clients,
      brokers,
    });
    return Readable.from(rows, {
      objectMode: true,
    });
  }

  private getDateFilter(
    startDate: Date,
    endDate: Date,
  ): Partial<ObjectQuery<BrokerPaymentEntity>> {
    const startOfDayDate = startOfDay(getDateInBusinessTimezone(startDate));
    const endOfDayDate = endOfDay(getDateInBusinessTimezone(endDate));
    return {
      batchDate: {
        $gte: startOfDayDate.toDate(),
        $lte: endOfDayDate.toDate(),
      },
    };
  }

  private toReportRows({
    brokerPayments,
    clients,
    brokers,
  }: {
    brokerPayments: BrokerPaymentEntity[];
    clients: Client[];
    brokers: Broker[];
  }): ReportRow[] {
    const rows: ReportRow[] = [];
    for (const brokerPayment of brokerPayments) {
      const client = clients.find(
        (c) => c.id === brokerPayment.invoice.clientId,
      );
      const broker = brokers.find(
        (b) => b.id === brokerPayment.invoice.brokerId,
      );
      const row: ReportRow = {
        batchDate: brokerPayment.batchDate,
        date: brokerPayment.createdAt,
        invoiceNumber: brokerPayment.invoice.displayId,
        invoiceLoadNumber: brokerPayment.invoice.loadNumber,
        clientDOT: client?.dot || 'N/A',
        clientMC: client?.mc || 'N/A',
        clientName: client?.name || 'N/A',
        accountManagerName:
          client?.factoringConfig?.clientSuccessTeam.name || 'N/A',
        brokerName: broker?.legalName || 'N/A',
        brokerMC: broker?.mc || 'N/A',
        brokerDOT: broker?.dot || 'N/A',
        transactionType: brokerPayment.type as BrokerPaymentType,
        amount: brokerPayment.invoice.accountsReceivableValue,
        paid: brokerPayment.amount,
      };
      rows.push(row);
    }
    return rows;
  }

  private async getBrokerPayments(
    filter: QBFilterQuery<BrokerPaymentEntity>,
  ): Promise<BrokerPaymentEntity[]> {
    return await this.repositories.brokerPayment
      .queryBuilder('bp')
      .select([
        'i.id',
        'i.clientId',
        'i.brokerId',
        'i.displayId',
        'i.loadNumber',
        'i.accountsReceivableValue',
        'bp.id',
        'bp.amount',
        'bp.type',
        'bp.batchDate',
        'bp.createdAt',
      ])
      .where(filter)
      .orderBy({ 'bp.createdAt': 'ASC' })
      .leftJoinAndSelect('invoice', 'i')
      .getResult();
  }

  private getMetadataRow(request: BrokerPaymentReportRequest): string {
    const startDate = getFormattedDateInBusinessTimezone(request.startDate);
    const endDate = getFormattedDateInBusinessTimezone(request.endDate);
    const ranDate = getFormattedDateInBusinessTimezone(new Date());
    return (
      `Broker Payment Report [${startDate} - ${endDate}]` +
      ` / Date ran: ${ranDate}`
    );
  }
}
