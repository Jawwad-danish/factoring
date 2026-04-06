import {
  getDateInBusinessTimezone,
  getFormattedDateInBusinessTimezone,
} from '@core/date-time';
import { Arrays } from '@core/util';
import {
  LoanTapeDateFilter,
  LoanTapeReportRequest,
} from '@fs-bobtail/factoring/data';
import { raw } from '@mikro-orm/core';
import { Broker, BrokerService } from '@module-brokers';
import { Client, ClientService } from '@module-clients';
import {
  InvoiceEntity,
  InvoiceStatus,
  RecordStatus,
  ReportName,
  TagDefinitionKey,
  TagStatus,
  VerificationStatus,
} from '@module-persistence/entities';
import { Repositories } from '@module-persistence/repositories';
import { BasicEntityUtil } from '@module-persistence/util';
import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import Big from 'big.js';
import { Readable } from 'stream';
import { FormatDefinition } from '../../../serialization/serialization-options';
import { LoanTapeReportCommand } from '../../loan-tape-report.command';
import { ReportHandler } from '../report-handler';

interface InvoiceStatusConfig {
  dateField: string;
  orderBy: any;
  additionalConditions?: any;
}

interface ReportRow {
  submittedDate: Date;
  invoiceStatus: string;
  processedDate?: Date;
  clientName: string;
  clientMC: string;
  clientDOT: string;
  accountManager: string;
  brokerName: string;
  brokerMC: string;
  brokerDOT: string;
  loadNumber: string;
  purchasedBy?: string;
  verification: string;
  accountsReceivableAmount: Big;
  purchasedFactorFee?: Big;
  chargeback: Big;
  clientInvoicePayment?: Big;
  brokerInvoicePayment?: Big;
  paidDate?: Date;
  lastUpdateDate?: Date;
  activityLogs?: string;
  //source: string; //TODO
}

const humanizeInvoiceVerificationStatus: Record<VerificationStatus, string> = {
  required: 'Required',
  not_required: 'Not Required',
  verified: 'Verified',
  bypassed: 'Bypassed',
  in_progress: 'In Progress',
  failed: 'Failed',
};

@CommandHandler(LoanTapeReportCommand)
export class LoanTapeReportCommandHandler
  implements ICommandHandler<LoanTapeReportCommand, Readable>
{
  private readonly logger = new Logger(LoanTapeReportCommandHandler.name);

  constructor(
    private readonly reportHandler: ReportHandler,
    private readonly repositories: Repositories,
    private readonly brokerService: BrokerService,
    private readonly clientService: ClientService,
  ) {}

  async execute({ request }: LoanTapeReportCommand): Promise<Readable> {
    const dataStream = await this.getReportDataStream(request);
    return this.reportHandler.processReport<ReportRow>(
      request.outputType,
      ReportName.LoanTape,
      dataStream,
      {
        formatDefinition: this.buildFormatDefinition(request),
        metadataRow: this.getMetadataRow(request),
      },
    );
  }

  private async getReportDataStream(
    request: LoanTapeReportRequest,
  ): Promise<Readable> {
    this.logger.log(`Fetching data for ${ReportName.LoanTape}...`);

    const invoices = await this.getInvoices(request);

    const clientIds = Arrays.uniqueNotNull(
      invoices,
      (invoice) => invoice.clientId,
    );
    const brokerIds = Arrays.uniqueNotNull(
      invoices,
      (invoice) => invoice.brokerId,
    );

    const clientsPromise = this.clientService.findByIds(clientIds);
    const brokersPromise = this.brokerService.findByIds(brokerIds);
    const [clients, brokers] = await Promise.all([
      clientsPromise,
      brokersPromise,
    ]);

    const rows = this.toReportRows(request, invoices, clients, brokers);
    return Readable.from(rows, {
      objectMode: true,
    });
  }

  private async getInvoices(
    request: LoanTapeReportRequest,
  ): Promise<InvoiceEntity[]> {
    const promises: Promise<InvoiceEntity[]>[] = [];
    promises.push(this.getInvoicesByStatus(request, InvoiceStatus.Purchased));

    if (request.includeDeclinedInvoices) {
      promises.push(this.getInvoicesByStatus(request, InvoiceStatus.Rejected));
    }
    if (request.includePendingInvoices) {
      promises.push(
        this.getInvoicesByStatus(request, InvoiceStatus.UnderReview),
      );
    }

    const results = await Promise.all(promises);
    return results.flat();
  }

  private async getInvoicesByStatus(
    request: LoanTapeReportRequest,
    status: InvoiceStatus,
  ): Promise<InvoiceEntity[]> {
    const startDate = getDateInBusinessTimezone(request.startDate);
    const endDate = getDateInBusinessTimezone(request.endDate);

    const statusConfig: Record<InvoiceStatus, InvoiceStatusConfig> = {
      [InvoiceStatus.Purchased]: {
        dateField: 'purchasedDate',
        orderBy: { purchasedDate: 'ASC' },
      },
      [InvoiceStatus.Rejected]: {
        dateField: 'rejectedDate',
        orderBy: { rejectedDate: 'ASC' },
      },
      [InvoiceStatus.UnderReview]: {
        dateField: 'createdAt',
        orderBy: { createdAt: 'ASC' },
      },
    };

    const config = statusConfig[status];

    let whereConditions: any = {};

    if (request.dateFilter === LoanTapeDateFilter.SUBMITTED_DATE) {
      whereConditions = {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
        status: status,
        ...(status !== InvoiceStatus.UnderReview && {
          [config.dateField]: { $ne: null },
        }),
        recordStatus: RecordStatus.Active,
      };
    } else {
      whereConditions = {
        status: status,
        [config.dateField]: {
          $gte: startDate,
          $lte: endDate,
        },
        recordStatus: RecordStatus.Active,
      };
    }

    const orderBy = config.orderBy;

    const queryBuilder = this.repositories.invoice
      .readOnlyQueryBuilder('i')
      .select([
        'i.id',
        'i.load_number',
        'i.accounts_receivable_value',
        'i.purchased_date',
        'i.rejected_date',
        'i.approved_factor_fee',
        'i.client_id',
        'i.broker_id',
        'i.status',
        'i.verification_status',
        'i.created_at',
        'i.updated_at',
        'i.deduction',
        'i.payment_date',
      ])
      .addSelect(
        raw(
          `(
            SELECT SUM(amount) FROM invoice_client_payments
            WHERE invoice_id = i.id
          ) as total_client_payments`,
        ),
      )
      .addSelect(
        raw(
          `(
            SELECT JSON_BUILD_OBJECT('amount', broker_payments.amount, 'created_at', broker_payments.created_at)
            FROM broker_payments
            WHERE broker_payments.invoice_id = i.id AND broker_payments.record_status = 'Active'
            ORDER BY broker_payments.created_at ASC
            LIMIT 1
          ) as first_broker_payment`,
        ),
      )
      .leftJoinAndSelect('i.activities', 'ial')
      .leftJoinAndSelect('i.buyout', 'ib')
      .leftJoinAndSelect('ial.tagDefinition', 'td')
      .leftJoinAndSelect('ial.createdBy', 'cb');

    const invoices = await queryBuilder
      .where(whereConditions)
      .orderBy(orderBy)
      .execute('all', true);

    return invoices;
  }

  private toReportRows(
    request: LoanTapeReportRequest,
    invoices: InvoiceEntity[],
    clients: Client[],
    brokers: Broker[],
  ): ReportRow[] {
    const rows: ReportRow[] = [];

    for (const invoice of invoices) {
      const client = clients.find((c) => c.id === invoice.clientId);
      const broker = brokers.find((b) => b.id === invoice.brokerId);
      const totalClientPayment = invoice['total_client_payments']
        ? Big(invoice['total_client_payments'])
        : invoice.buyout
        ? invoice.accountsReceivableValue
        : Big(0);

      const firstBrokerPayment = invoice['first_broker_payment'];
      const brokerInvoicePayment = firstBrokerPayment
        ? Big(firstBrokerPayment.amount)
        : Big(0);
      const paidDate = firstBrokerPayment
        ? new Date(firstBrokerPayment.created_at)
        : undefined;

      const purchasedBy = invoice.activities.find(
        (ial) =>
          ial.tagDefinition.key === TagDefinitionKey.UPDATE_INVOICE &&
          (ial.note.includes('Changed status from under_review') ||
            ial.note.includes('Approved for')),
      )?.createdBy;

      const processedDate = this.buildProcessedDate(invoice);

      const row: ReportRow = {
        submittedDate: invoice.createdAt,
        invoiceStatus: invoice.status,
        clientName: client?.name || 'N/A',
        clientMC: client?.mc || 'N/A',
        clientDOT: client?.dot || 'N/A',
        accountManager:
          client?.factoringConfig?.clientSuccessTeam.name || 'N/A',
        brokerName: broker?.legalName || 'N/A',
        brokerMC: broker?.mc || 'N/A',
        brokerDOT: broker?.dot || 'N/A',
        loadNumber: invoice.loadNumber,
        processedDate: processedDate || undefined,
        accountsReceivableAmount: invoice.accountsReceivableValue,
        purchasedFactorFee: invoice.approvedFactorFee || undefined,
        verification:
          humanizeInvoiceVerificationStatus[invoice.verificationStatus],
        chargeback: invoice.deduction || undefined,
        paidDate: paidDate,
        brokerInvoicePayment: brokerInvoicePayment,
        clientInvoicePayment: totalClientPayment || undefined,
        purchasedBy: purchasedBy
          ? `${purchasedBy.firstName} ${purchasedBy.lastName}`
          : undefined,
      };
      if (request.includeInvoiceUpdates) {
        row.activityLogs = invoice.activities
          .filter((ial) => ial.tagStatus === TagStatus.Active)
          .map((ial) => ial.tagDefinition.name)
          .join(', ');
      }
      if (request.includeLastUpdateDate) {
        row.lastUpdateDate = BasicEntityUtil.getLastActiveEntity(
          invoice.activities,
        )?.createdAt;
      }
      rows.push(row);
    }
    return rows;
  }

  private buildProcessedDate(invoice: InvoiceEntity): Date | null {
    let processedDate =
      invoice.buyout && invoice.status !== InvoiceStatus.UnderReview
        ? invoice.buyout?.paymentDate
        : invoice.purchasedDate;

    if (invoice.rejectedDate) {
      processedDate = invoice.rejectedDate;
    }

    if (invoice.rejectedDate && invoice.purchasedDate) {
      if (
        getDateInBusinessTimezone(invoice.rejectedDate).isAfter(
          getDateInBusinessTimezone(invoice.purchasedDate),
        )
      ) {
        processedDate = invoice.rejectedDate;
      } else {
        processedDate = invoice.purchasedDate;
      }
    }

    if (
      !invoice.rejectedDate &&
      !invoice.purchasedDate &&
      !invoice.buyout?.paymentDate
    ) {
      return null;
    }

    return processedDate;
  }

  private buildFormatDefinition(
    request: LoanTapeReportRequest,
  ): FormatDefinition<ReportRow> {
    const formatDefinition: FormatDefinition<ReportRow> = {
      submittedDate: { type: 'date-time', label: 'Submitted Date' },
      invoiceStatus: { type: 'string', label: 'Invoice Status' },
      processedDate: { type: 'date-time', label: 'Processed Date' },
      clientName: { type: 'string', label: 'Client Name' },
      clientMC: { type: 'string', label: 'Client MC' },
      clientDOT: { type: 'string', label: 'Client DOT' },
      accountManager: { type: 'string', label: 'Account Manager' },
      brokerName: { type: 'string', label: 'Broker Name' },
      brokerMC: { type: 'string', label: 'Broker MC' },
      brokerDOT: { type: 'string', label: 'Broker DOT' },
      loadNumber: { type: 'string', label: 'Load Number' },
      purchasedBy: { type: 'string', label: 'Purchased By' },
      verification: { type: 'string', label: 'Verification' },
      accountsReceivableAmount: {
        type: 'currency',
        label: 'Invoiced(Accounts Receivable Amount)',
      },
      purchasedFactorFee: { type: 'currency', label: 'Fees' },
      chargeback: { type: 'currency', label: 'Chargeback' },
      clientInvoicePayment: { type: 'currency', label: 'Funded' },
      brokerInvoicePayment: { type: 'currency', label: 'Payment' },
      paidDate: { type: 'date-time', label: 'Paid Date' },
      //source: { type: 'string', label: 'Source' },
    };
    if (request.includeInvoiceUpdates) {
      formatDefinition.activityLogs = { type: 'string', label: 'Updates' };
    }
    if (request.includeLastUpdateDate) {
      formatDefinition.lastUpdateDate = {
        type: 'date-time',
        label: 'Last Update',
      };
    }
    if (request.includeLastUpdateDate) {
      formatDefinition.lastUpdateDate = {
        type: 'date-time',
        label: 'Last Update',
      };
    }
    return formatDefinition;
  }

  private getMetadataRow(request: LoanTapeReportRequest): string {
    const startDate = getFormattedDateInBusinessTimezone(request.startDate);
    const endDate = getFormattedDateInBusinessTimezone(request.endDate);
    const ranDate = getFormattedDateInBusinessTimezone(new Date());
    return (
      `Loan Tape Report [${startDate} - ${endDate}]` + ` / Date ran: ${ranDate}`
    );
  }
}
