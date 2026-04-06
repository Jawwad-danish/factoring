import {
  endOfDay,
  getDateInBusinessTimezone,
  getFormattedDateInBusinessTimezone,
  startOfDay,
} from '@core/date-time';
import { BatchReportRequest } from '@fs-bobtail/factoring/data';
import { ObjectQuery, QBFilterQuery } from '@mikro-orm/core';
import { Broker, BrokerService } from '@module-brokers';
import { Client, ClientService } from '@module-clients';
import {
  BrokerPaymentEntity,
  BrokerPaymentType,
  ReportName,
} from '@module-persistence/entities';
import { Repositories } from '@module-persistence/repositories';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import Big from 'big.js';
import { Readable } from 'stream';
import { BatchReportCommand } from '../../batch-report.command';
import { ReportHandler } from '../report-handler';

interface ReportRow {
  invoiceNumber: string;
  invoiceLoadNumber: string;
  clientName?: string;
  clientDOT?: string;
  clientMC?: string;
  accountManagerName: string;
  brokerName?: string;
  brokerMC?: string;
  brokerDOT?: string;
  transactionType: string;
  invoicedAmount: Big;
  brokerPaymentAmount: Big;
}

@CommandHandler(BatchReportCommand)
export class BatchReportCommandHandler
  implements ICommandHandler<BatchReportCommand, Readable>
{
  constructor(
    private readonly reportHandler: ReportHandler,
    private readonly repositories: Repositories,
    private readonly clientService: ClientService,
    private readonly brokerService: BrokerService,
  ) {}

  async execute({ request }: BatchReportCommand): Promise<Readable> {
    const dataStream = await this.getReportDataStream(request);
    return this.reportHandler.processReport<ReportRow>(
      request.outputType,
      ReportName.Batch,
      dataStream,
      {
        formatDefinition: {
          invoiceNumber: { type: 'string', label: 'Invoice #' },
          invoiceLoadNumber: { type: 'string', label: 'Load #' },
          clientName: { type: 'string', label: 'Client Name' },
          clientMC: { type: 'string', label: 'Client MC' },
          clientDOT: { type: 'string', label: 'Client DOT' },
          accountManagerName: { type: 'string', label: 'Account Manager' },
          brokerName: { type: 'string', label: 'Broker Name' },
          brokerMC: { type: 'string', label: 'Broker MC' },
          brokerDOT: { type: 'string', label: 'Broker DOT' },
          transactionType: { type: 'string', label: 'Transaction Type' },
          invoicedAmount: { type: 'currency', label: 'Invoiced' },
          brokerPaymentAmount: { type: 'currency', label: 'Payment' },
        },

        metadataRow: this.getMetadataRow(request),
      },
    );
  }

  async getReportDataStream(request: BatchReportRequest): Promise<Readable> {
    const filter: QBFilterQuery<BrokerPaymentEntity> = {
      ...this.getDateFilter(request.date),
      ...this.getPaymentTypeFilter(request.paymentTypes),
    };
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

  private getDateFilter(date: Date): Partial<ObjectQuery<BrokerPaymentEntity>> {
    const dateInBusinessTimezone = getDateInBusinessTimezone(date);
    const startOfDayDate = startOfDay(dateInBusinessTimezone);
    const endOfDayDate = endOfDay(dateInBusinessTimezone);
    return {
      batchDate: {
        $gte: startOfDayDate.toDate(),
        $lte: endOfDayDate.toDate(),
      },
    };
  }

  private getPaymentTypeFilter(
    paymentType: BrokerPaymentType[],
  ): Partial<ObjectQuery<BrokerPaymentEntity>> {
    if (paymentType.length === 1) {
      return {
        type: { $eq: paymentType[0] },
      };
    }
    return {
      type: { $in: paymentType },
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
        invoicedAmount: brokerPayment.invoice.accountsReceivableValue,
        brokerPaymentAmount: brokerPayment.amount,
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
      ])
      .where(filter)
      .leftJoinAndSelect('invoice', 'i')
      .getResult();
  }

  private getMetadataRow(request: BatchReportRequest): string {
    const type = `(${request.paymentTypes.join(' + ')})`;
    const forDate = getFormattedDateInBusinessTimezone(request.date);
    const ranDate = getFormattedDateInBusinessTimezone(new Date());
    return `Batch Report ${type} ${forDate}` + ` / Date ran: ${ranDate}`;
  }
}
