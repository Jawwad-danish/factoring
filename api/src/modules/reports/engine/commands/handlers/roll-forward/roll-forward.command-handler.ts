import {
  getDateInBusinessTimezone,
  getFormattedDateInBusinessTimezone,
} from '@core/date-time';
import { Arrays } from '@core/util';
import {
  ClientSummaryRequest,
  RollForwardRequest,
} from '@fs-bobtail/factoring/data';
import { raw } from '@mikro-orm/core';
import { ClientApi } from '@module-clients';
import {
  BrokerPaymentEntitySchema,
  InvoiceEntitySchema,
  RecordStatus,
  ReportName,
  ReserveEntitySchema,
  ReserveReason,
} from '@module-persistence/entities';
import { Repositories } from '@module-persistence/repositories';
import { SqlHelper } from '@module-persistence/util';
import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import Big from 'big.js';
import { Readable } from 'stream';
import { RollForwardReportCommand } from '../../roll-forward-report.command';
import { ReportHandler } from '../report-handler';

interface ReportRow {
  clientName: string;
  accountManager: string;
  clientMC: string;
  clientDOT: string;
  purchased: Big;
  payments: Big;
  shortpaid: Big;
  nonCashDebits: Big;
  cashDebits: Big;
  nonCashCredits: Big;
  cashCredits: Big;
}

interface InvoiceRow {
  clientId: string;
  totalPurchased: Big;
  totalPaid: Big;
}

interface ReserveRow {
  clientId: string;
  cashDebits: Big;
  nonCashDebits: Big;
  cashCredits: Big;
  nonCashCredits: Big;
}

interface ClientRow {
  id: string;
  name: string;
  accountManager: string;
  MC: string;
  DOT: string;
}

@CommandHandler(RollForwardReportCommand)
export class RollForwardReportCommandHandler
  implements ICommandHandler<RollForwardReportCommand>
{
  private logger = new Logger(RollForwardReportCommandHandler.name);

  constructor(
    private readonly reportHandler: ReportHandler,
    private readonly repositories: Repositories,
    private readonly clientApi: ClientApi,
  ) {}

  async execute({ request }: RollForwardReportCommand): Promise<Readable> {
    const dataStream = await this.getReportDataStream(request);
    return this.reportHandler.processReport<ReportRow>(
      request.outputType,
      ReportName.ClientSummary,
      dataStream,
      {
        formatDefinition: {
          clientName: { type: 'string', label: 'Client' },
          accountManager: { type: 'string', label: 'Account Manager' },
          clientMC: { type: 'string', label: 'Client MC' },
          clientDOT: { type: 'string', label: 'Client DOT' },
          purchased: { type: 'currency', label: 'Purchased' },
          payments: { type: 'currency', label: 'Payments' },
          shortpaid: { type: 'currency', label: 'Shortpaid' },
          nonCashDebits: { type: 'currency', label: 'Non cash debits' },
          cashDebits: { type: 'currency', label: 'Cash debits' },
          nonCashCredits: { type: 'currency', label: 'Non cash credits' },
          cashCredits: { type: 'currency', label: 'Cash credits' },
        },
        metadataRow: this.getMetadataRow(request),
      },
    );
  }

  private async getReportDataStream(
    request: ClientSummaryRequest,
  ): Promise<Readable> {
    const startDate = getDateInBusinessTimezone(request.startDate).toDate();
    const endDate = getDateInBusinessTimezone(request.endDate).toDate();
    const invoiceRows = await this.getInvoiceRows(startDate, endDate);

    const clientIds = Arrays.uniqueNotNull(
      invoiceRows,
      (invoice) => invoice.clientId,
    );
    const reserveRows = await this.getReserveRow(clientIds, startDate, endDate);
    const clientRows = await this.getClientRows(clientIds);
    const rows = this.toReportRows(clientRows, invoiceRows, reserveRows);
    return Readable.from(rows, {
      objectMode: true,
    });
  }

  private async getClientRows(clientIDs: string[]): Promise<ClientRow[]> {
    const clients = await this.clientApi.getAllClients();
    const factoringConfigs = await this.repositories.clientFactoringConfig
      .readOnlyQueryBuilder('cfc')
      .leftJoinAndSelect('cfc.clientSuccessTeam', 'cst')
      .select(['cfc.client_id', 'cst.name'])
      .where({
        clientId: { $in: clientIDs },
        recordStatus: RecordStatus.Active,
      })
      .execute('all', false);

    const rows: ClientRow[] = [];
    for (const factoringConfig of factoringConfigs) {
      const client = clients.find(
        (client) => client.id === factoringConfig['client_id'],
      );
      if (!client) {
        this.logger.warn(
          `Could not find client with ID ${factoringConfig['client_id']} for roll forward report`,
        );
        continue;
      }
      rows.push({
        id: factoringConfig['client_id'],
        name: client!.name,
        accountManager: factoringConfig['name'],
        MC: client!.mc,
        DOT: client!.dot,
      });
    }
    return rows;
  }

  private async getInvoiceRows(
    startDate: Date,
    endDate: Date,
  ): Promise<InvoiceRow[]> {
    const rows = await this.repositories.invoice
      .readOnlyQueryBuilder('i')
      .select([
        `i.${InvoiceEntitySchema.COLUMN_CLIENT_ID}`,
        raw(
          `SUM(i.${InvoiceEntitySchema.COLUMN_ACCOUNTS_RECEIVABLE_VALUE}) as total_purchased`,
        ),
        raw(`SUM(bp.${BrokerPaymentEntitySchema.COLUMN_AMOUNT}) as total_paid`),
      ])
      .leftJoin('brokerPayments', 'bp', {
        'bp.recordStatus': RecordStatus.Active,
      })
      .groupBy([`i.${InvoiceEntitySchema.COLUMN_CLIENT_ID}`])
      .where({
        createdAt: {
          $lte: endDate,
          $gte: startDate,
        },
        recordStatus: RecordStatus.Active,
      })
      .execute('all', false);

    return rows.map((row) => {
      return {
        clientId: row[InvoiceEntitySchema.COLUMN_CLIENT_ID],
        totalPurchased: new Big(row['total_purchased'] || 0),
        totalPaid: new Big(row['total_paid'] || 0),
      };
    });
  }
  private async getReserveRow(
    clientIDs: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<ReserveRow[]> {
    const nonCashDebitsReasons = [
      ReserveReason.BrokerClaim,
      ReserveReason.BrokerClaimRemoved,
    ];
    const cashDebitsReasons = [
      ReserveReason.ReleaseOfFunds,
      ReserveReason.ReleaseOfFundsRemoved,
      ReserveReason.ReleaseToThirdParty,
      ReserveReason.ReleaseToThirdPartyRemoved,
    ];
    const nonCashCreditsReasons = [
      ReserveReason.ClientCredit,
      ReserveReason.ClientCreditRemoved,
      ReserveReason.WriteOff,
      ReserveReason.WriteOffRemoved,
      ReserveReason.Chargeback,
      ReserveReason.ChargebackRemoved,
    ];
    const cashCreditsReasons = [
      ReserveReason.NonFactoredPayment,
      ReserveReason.NonFactoredPaymentRemoved,
      ReserveReason.DirectPaymentByClient,
      ReserveReason.DirectPaymentByClientRemoved,
      ReserveReason.AdditionalPayment,
      ReserveReason.PaymentRemoved,
    ];
    const reserves = await this.repositories.reserve
      .readOnlyQueryBuilder('r')
      .select([
        `r.${ReserveEntitySchema.COLUMN_CLIENT_ID}`,
        raw(
          `SUM(CASE WHEN r.${
            ReserveEntitySchema.COLUMN_REASON
          } IN (${SqlHelper.inOperatorValues(
            nonCashDebitsReasons,
          )}) THEN r.amount ELSE 0 END) AS non_cash_debits,
          SUM(CASE WHEN r.${
            ReserveEntitySchema.COLUMN_REASON
          } IN (${SqlHelper.inOperatorValues(
            cashDebitsReasons,
          )}) THEN r.amount ELSE 0 END) AS cash_debits,
          SUM(CASE WHEN r.${
            ReserveEntitySchema.COLUMN_REASON
          } IN (${SqlHelper.inOperatorValues(
            nonCashCreditsReasons,
          )}) THEN r.amount ELSE 0 END) AS non_cash_credits,
          SUM(CASE WHEN r.${
            ReserveEntitySchema.COLUMN_REASON
          } IN (${SqlHelper.inOperatorValues(
            cashCreditsReasons,
          )}) THEN r.amount ELSE 0 END) AS cash_credits`,
        ),
      ])
      .where({
        clientId: { $in: clientIDs },
        recordStatus: RecordStatus.Active,
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .groupBy(['r.clientId'])
      .execute('all', false);
    return reserves.map((row) => {
      return {
        clientId: row[ReserveEntitySchema.COLUMN_CLIENT_ID],
        cashDebits: new Big(row['cash_debits']),
        nonCashDebits: new Big(row['non_cash_debits']),
        cashCredits: new Big(row['cash_credits']),
        nonCashCredits: new Big(row['non_cash_credits']),
      };
    });
  }

  private toReportRows(
    clientRows: ClientRow[],
    invoiceRows: InvoiceRow[],
    reserveRows: ReserveRow[],
  ): ReportRow[] {
    const rows: ReportRow[] = [];
    for (const client of clientRows) {
      const invoiceRow = invoiceRows.find((row) => row.clientId === client.id);
      const reserveRow = reserveRows.find((row) => row.clientId === client.id);
      const row: ReportRow = {
        clientName: client.name,
        accountManager: client.accountManager || 'N/A',
        clientMC: client.MC,
        clientDOT: client.DOT,
        purchased: invoiceRow?.totalPurchased || new Big(0),
        payments: invoiceRow?.totalPaid || new Big(-1),
        shortpaid:
          invoiceRow?.totalPurchased && invoiceRow?.totalPaid
            ? invoiceRow.totalPurchased.minus(invoiceRow.totalPaid)
            : new Big(-1),
        nonCashDebits: reserveRow?.nonCashDebits || new Big(0),
        cashDebits: reserveRow?.cashDebits || new Big(0),
        nonCashCredits: reserveRow?.nonCashCredits || new Big(0),
        cashCredits: reserveRow?.cashCredits || new Big(0),
      };
      rows.push(row);
    }
    return rows;
  }

  private getMetadataRow(request: RollForwardRequest): string {
    const startDate = getFormattedDateInBusinessTimezone(request.startDate);
    const endDate = getFormattedDateInBusinessTimezone(request.endDate);
    const ranDate = getFormattedDateInBusinessTimezone(new Date());
    return (
      `Roll forward Report [${startDate} - ${endDate}]` +
      ` / Date ran: ${ranDate}`
    );
  }
}
