import {
  getDateInBusinessTimezone,
  getFormattedDateInBusinessTimezone,
} from '@core/date-time';
import { Arrays } from '@core/util';
import { ClientSummaryRequest } from '@fs-bobtail/factoring/data';
import { raw } from '@mikro-orm/core';
import { Client, ClientService } from '@module-clients';
import { InvoiceDataAccess } from '@module-invoices';
import {
  BrokerPaymentStatus,
  ClientFactoringConfigsEntity,
  InvoiceEntity,
  InvoiceEntitySchema,
  InvoiceStatus,
  RecordStatus,
  ReportName,
  ReserveEntity,
  ReserveReason,
} from '@module-persistence/entities';
import { Repositories } from '@module-persistence/repositories';
import { BasicEntityUtil } from '@module-persistence/util';
import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import Big from 'big.js';
import { Readable } from 'stream';
import { ClientDilutionStats } from '../../../data-access-types';
import { ReportsDataAccess } from '../../../reports.data-access';
import { ClientSummaryReportCommand } from '../../client-summary-report.command';
import { ReportHandler } from '../report-handler';

interface ReportRow {
  clientName: string;
  accountManager: string;
  clientMc: string;
  clientDot: string;
  registeredDate: Date;
  startDate: Date;
  clientState: string;
  clientStatus: string;
  verification: string;
  factorRate: Big;
  invoiced: Big;
  factorFees: Big;
  payment: Big;
  shortpaid: Big;
  brokerClaim: Big;
  clientCredit: Big;
  otherFees: Big;
  //wireFees: Big; //TODO
  chargebacks: Big;
  directPayments: Big;
  nonFactoredPayments: Big;
  additionalPayments: Big;
  dilution: Big;
  adjDilution: Big;
  writeOffs: Big;
  daysTurn: string;
  nfe: Big;
  totalAR: Big;
  salesperson: string;
}

const reservesReasons: ReserveReason[] = [
  ReserveReason.ClientCredit,
  ReserveReason.ClientCreditRemoved,
  ReserveReason.BrokerClaim,
  ReserveReason.BrokerClaimRemoved,
  ReserveReason.Fee,
  ReserveReason.FeeRemoved,
  ReserveReason.WriteOff,
  ReserveReason.WriteOffRemoved,
  ReserveReason.Chargeback,
  ReserveReason.ChargebackRemoved,
  ReserveReason.DirectPaymentByClient,
  ReserveReason.DirectPaymentByClientRemoved,
  ReserveReason.NonFactoredPayment,
  ReserveReason.NonFactoredPaymentRemoved,
  ReserveReason.AdditionalPayment,
  ReserveReason.Shortpay,
  ReserveReason.NonPayment,
  ReserveReason.Overpay,
];

interface ClientTotalsApprovedStats {
  netFundsEmployed: Big;
  totalAr: Big;
}

interface ClientRawData {
  client: Client;
  config: ClientFactoringConfigsEntity;
  reserves: ReserveEntity[];
  dilution: ClientDilutionStats;
  totalsApproved: ClientTotalsApprovedStats;
  startDate: Date;
}

@CommandHandler(ClientSummaryReportCommand)
export class ClientSummaryReportCommandHandler
  implements ICommandHandler<ClientSummaryReportCommand, Readable>
{
  private readonly logger = new Logger(ClientSummaryReportCommandHandler.name);

  constructor(
    private readonly reportHandler: ReportHandler,
    private readonly repositories: Repositories,
    private readonly clientService: ClientService,
    private readonly invoiceDataAccess: InvoiceDataAccess,
    private readonly dataAccess: ReportsDataAccess,
  ) {}

  async execute({ request }: ClientSummaryReportCommand): Promise<Readable> {
    const dataStream = await this.getReportDataStream(request);
    return this.reportHandler.processReport<ReportRow>(
      request.outputType,
      ReportName.ClientSummary,
      dataStream,
      {
        formatDefinition: {
          clientName: { type: 'string', label: 'Client' },
          accountManager: { type: 'string', label: 'Account Manager' },
          clientMc: { type: 'string', label: 'Client MC' },
          clientDot: { type: 'string', label: 'Client DOT' },
          registeredDate: { type: 'date', label: 'Registered Date' },
          startDate: { type: 'date', label: 'Start Date' },
          clientState: { type: 'string', label: 'Client State' },
          clientStatus: { type: 'string', label: 'Client Status' },
          verification: { type: 'string', label: 'Verification' },
          factorRate: {
            type: 'number',
            label: 'Factor Rate',
            options: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
          },
          invoiced: { type: 'currency', label: 'Invoiced' },
          factorFees: { type: 'currency', label: 'Factor Fees' },
          payment: { type: 'currency', label: 'First Payments' },
          shortpaid: { type: 'currency', label: 'Shortpaid' },
          brokerClaim: { type: 'currency', label: 'Debtor Claim' },
          clientCredit: { type: 'currency', label: 'Client Credit' },
          otherFees: { type: 'currency', label: 'Other Fees' },
          chargebacks: { type: 'currency', label: 'Chargebacks' },
          directPayments: { type: 'currency', label: 'Direct Payments' },
          nonFactoredPayments: {
            type: 'currency',
            label: 'Non-factored Payments',
          },
          additionalPayments: {
            type: 'currency',
            label: 'Additional Payments',
          },
          dilution: {
            type: 'percentage',
            label: 'Dilution',
            options: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
          },
          adjDilution: {
            type: 'percentage',
            label: 'Adj Dilution',
            options: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
          },
          writeOffs: { type: 'currency', label: 'Write Offs' },
          daysTurn: { type: 'string', label: 'Days Turn' },
          nfe: { type: 'currency', label: 'NFE' },
          totalAR: { type: 'currency', label: 'Total AR' },
          salesperson: { type: 'string', label: 'Salesperson' },
        },
        metadataRow: this.getMetadataRow(request),
      },
    );
  }

  private async getReportDataStream(
    request: ClientSummaryRequest,
  ): Promise<Readable> {
    this.logger.log(
      `Fetching and enriching data for ${ReportName.ClientSummary}...`,
    );
    const startDate = getDateInBusinessTimezone(request.startDate).toDate();
    const endDate = getDateInBusinessTimezone(request.endDate).toDate();
    const invoices = await this.getInvoices(startDate, endDate);

    const clientIds = Arrays.uniqueNotNull(
      invoices,
      (invoice) => invoice.clientId,
    );

    const clientData = await this.resolveClientRawData(
      clientIds,
      startDate,
      endDate,
    );

    const rows = this.toReportRows(clientData, invoices, endDate);

    return Readable.from(rows, {
      objectMode: true,
    });
  }

  private async resolveClientRawData(
    clientIds: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<ClientRawData[]> {
    const clientsPromise = this.clientService.findByIds(clientIds);
    const clientStartDatesPromise = this.getClientsStartDate(clientIds);
    const clientFactoringPromise =
      this.getClientFactoringConfigsByIds(clientIds);
    const reservesPromise = this.getReservesByReasonsForClients(
      clientIds,
      startDate,
      endDate,
    );
    const clientsTotalsApprovedPromise = this.getClientTotalsApproved(
      clientIds,
      endDate,
    );
    const [
      clients,
      clientStartDates,
      clientsConfigs,
      reserves,
      clientsTotalsApproved,
    ] = await Promise.all([
      clientsPromise,
      clientStartDatesPromise,
      clientFactoringPromise,
      reservesPromise,
      clientsTotalsApprovedPromise,
    ]);

    const dilutions = await this.dataAccess.resolveDilutionStatsBetweenRange(
      clientIds,
      reserves,
      startDate,
      endDate,
    );

    return clients.map((client) => {
      const config = clientsConfigs.find((c) => c.clientId === client.id)!;
      const clientReserves = reserves.filter(
        (r) => r['client_id'] === client.id,
      );
      const dilution = dilutions.get(client.id)!;
      const totalsApproved = clientsTotalsApproved.get(client.id)!;
      const start =
        (clientStartDates.find(
          (invoice) => invoice['client_id'] === client.id,
        )?.['start_date'] as Date) || null;
      return {
        client,
        config,
        reserves: clientReserves,
        dilution,
        totalsApproved,
        startDate: start,
      };
    });
  }

  private async getInvoices(
    startDate: Date,
    endDate: Date,
  ): Promise<InvoiceEntity[]> {
    const invoices = await this.repositories.invoice
      .readOnlyQueryBuilder('i')
      .select([
        `i.${InvoiceEntitySchema.COLUMN_ID}`,
        `i.${InvoiceEntitySchema.COLUMN_CLIENT_ID}`,
        `i.${InvoiceEntitySchema.COLUMN_LOAD_NUMBER}`,
        `i.${InvoiceEntitySchema.COLUMN_ACCOUNTS_RECEIVABLE_VALUE}`,
        `i.${InvoiceEntitySchema.COLUMN_PAYMENT_DATE}`,
        `i.${InvoiceEntitySchema.COLUMN_APPROVED_FACTOR_FEE}`,
        `i.${InvoiceEntitySchema.COLUMN_CREATED_AT}`,
        `i.${InvoiceEntitySchema.COLUMN_EXPEDITED}`,
        `i.${InvoiceEntitySchema.COLUMN_BROKER_PAYMENT_STATUS}`,
      ])
      .leftJoinAndSelect('i.brokerPayments', 'ibp')
      .where({
        purchasedDate: {
          $lte: endDate,
          $gte: startDate,
        },
        recordStatus: RecordStatus.Active,
        status: InvoiceStatus.Purchased,
      })
      .getResultList();

    return invoices;
  }

  private async getClientFactoringConfigsByIds(
    clientIds: string[],
  ): Promise<ClientFactoringConfigsEntity[]> {
    this.logger.log(
      `Fetching and enriching client factoring data for ${ReportName.ClientSummary}...`,
    );
    const clientFactoringConfigs = await this.repositories.clientFactoringConfig
      .readOnlyQueryBuilder('cfc')
      .leftJoinAndSelect('cfc.clientSuccessTeam', 'cst')
      .leftJoinAndSelect('cfc.salesRep', 'sr')
      .select([
        'cfc.id',
        'cfc.clientId',
        'cfc.createdAt',
        'cfc.status',
        'cfc.requiresVerification',
        'cfc.factoringRatePercentage',
      ])
      .where({
        clientId: { $in: clientIds },
        recordStatus: RecordStatus.Active,
      })
      .getResultList();

    return clientFactoringConfigs;
  }

  private async getReservesByReasonsForClients(
    clientIDs: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<ReserveEntity[]> {
    this.logger.log(
      `Fetching and enriching client reserves data for ${ReportName.ClientSummary}...`,
    );
    const reserves = await this.repositories.reserve
      .readOnlyQueryBuilder('r')
      .select(['r.clientId', 'r.reason', raw('SUM(r.amount) as total')])
      .where({
        clientId: { $in: clientIDs },
        recordStatus: RecordStatus.Active,
        reason: {
          $in: reservesReasons,
        },
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .groupBy(['r.clientId', 'r.reason'])
      .execute('all', false);
    return reserves;
  }

  private async getClientTotalsApproved(
    clientIDs: string[],
    endDate: Date,
  ): Promise<Map<string, ClientTotalsApprovedStats>> {
    this.logger.log(
      `Fetching and enriching client totals approved data for ${ReportName.ClientSummary}...`,
    );

    const totals = await this.invoiceDataAccess.getClientsAgingGeneralTotal(
      clientIDs,
      endDate,
      endDate,
    );
    return totals;
  }

  private resolveClientInvoicesAmounts(
    invoices: InvoiceEntity[],
    endDate: Date,
  ): {
    approvedAr: Big;
    paidAr: Big;
    fees: Big;
    shortpaid: Big;
    firstBrokerPaymentsTotal: Big;
  } {
    const approvedInvoices: InvoiceEntity[] = [];
    const paidInvoices: InvoiceEntity[] = [];
    let shortpaid = new Big(0);

    invoices.forEach((invoice) => {
      if (!invoice.paymentDate || invoice.paymentDate > endDate) {
        approvedInvoices.push(invoice);
      } else {
        paidInvoices.push(invoice);
      }
    });

    for (const paidInvoice of paidInvoices) {
      let invoiceShortPaid = new Big(0);
      if (
        paidInvoice.brokerPaymentStatus == BrokerPaymentStatus.ShortPaid ||
        paidInvoice.brokerPaymentStatus == BrokerPaymentStatus.NonPayment
      ) {
        for (const brokerPayment of paidInvoice.brokerPayments) {
          invoiceShortPaid = invoiceShortPaid.add(brokerPayment.amount);
        }
      }
      if (!invoiceShortPaid.eq(0)) {
        shortpaid = shortpaid
          .add(paidInvoice.accountsReceivableValue)
          .sub(invoiceShortPaid);
      }
    }
    const approvedAr = approvedInvoices.reduce(
      (total, invoice) => total.add(invoice.accountsReceivableValue),
      new Big(0),
    );
    const paidAr = paidInvoices.reduce(
      (total, invoice) => total.add(invoice.accountsReceivableValue),
      new Big(0),
    );
    const fees = invoices.reduce(
      (total, invoice) => total.add(invoice.approvedFactorFee),
      new Big(0),
    );
    const firstBrokerPaymentsTotal = paidInvoices.reduce((total, invoice) => {
      const firstBrokerPayment = BasicEntityUtil.sortEntitiesAsc(
        invoice.brokerPayments,
      )[0];
      return total.add(
        firstBrokerPayment ? firstBrokerPayment.amount : new Big(0),
      );
    }, new Big(0));
    return { approvedAr, paidAr, fees, shortpaid, firstBrokerPaymentsTotal };
  }

  private async getClientsStartDate(
    clientIds: string[],
  ): Promise<InvoiceEntity[]> {
    const result = await this.repositories.invoice
      .readOnlyQueryBuilder('i')
      .select([
        `i.${InvoiceEntitySchema.COLUMN_CLIENT_ID}`,
        raw(`MIN(i.${InvoiceEntitySchema.COLUMN_CREATED_AT}) as start_date`),
      ])
      .where({
        clientId: { $in: clientIds },
        recordStatus: RecordStatus.Active,
      })
      .groupBy(`i.${InvoiceEntitySchema.COLUMN_CLIENT_ID}`)
      .execute('all', false);

    return result;
  }

  private toReportRows(
    clientsData: ClientRawData[],
    clientsInvoices: InvoiceEntity[],
    endDate: Date,
  ): ReportRow[] {
    const rows: ReportRow[] = [];
    for (const clientData of clientsData) {
      const { client, config, reserves, dilution, totalsApproved, startDate } =
        clientData;
      const invoices = clientsInvoices.filter(
        (inv) => inv.clientId === client.id,
      );
      const { approvedAr, paidAr, fees, shortpaid, firstBrokerPaymentsTotal } =
        this.resolveClientInvoicesAmounts(invoices, endDate);

      const totalBrokerClaim = this.dataAccess.sumByReasons(reserves, [
        ReserveReason.BrokerClaim,
        ReserveReason.BrokerClaimRemoved,
      ]);

      const totalClientCredit = this.dataAccess.sumByReasons(reserves, [
        ReserveReason.ClientCredit,
        ReserveReason.ClientCreditRemoved,
      ]);

      const totalFees = this.dataAccess
        .sumByReasons(reserves, [ReserveReason.Fee, ReserveReason.FeeRemoved])
        .neg();

      const totalChargebacks = this.dataAccess.sumByReasons(reserves, [
        ReserveReason.Chargeback,
        ReserveReason.ChargebackRemoved,
      ]);

      const totalDirectPayments = this.dataAccess.sumByReasons(reserves, [
        ReserveReason.DirectPaymentByClient,
        ReserveReason.DirectPaymentByClientRemoved,
      ]);

      const totalNonFactoredPayments = this.dataAccess.sumByReasons(reserves, [
        ReserveReason.NonFactoredPayment,
        ReserveReason.NonFactoredPaymentRemoved,
      ]);

      const totalAdditionalPayments = this.dataAccess.sumByReasons(reserves, [
        ReserveReason.AdditionalPayment,
      ]);

      const totalWriteOffs = this.dataAccess.sumByReasons(reserves, [
        ReserveReason.WriteOff,
        ReserveReason.WriteOffRemoved,
      ]);

      const row: ReportRow = {
        clientName: client.name,
        accountManager: config.clientSuccessTeam.name || 'N/A',
        clientMc: client.mc,
        clientDot: client.dot,
        registeredDate: client.createdAt,
        startDate: startDate,
        clientState:
          client.getBusinessContact()?.getState() ||
          client.getPrimaryContact()?.getState() ||
          client.getOwnerContact()?.getState() ||
          'N/A',
        clientStatus: config.status || 'N/A',
        verification: config.requiresVerification ? 'Yes' : 'No',
        factorRate: config.factoringRatePercentage.round(2),
        invoiced: approvedAr.add(paidAr),
        factorFees: fees,
        payment: firstBrokerPaymentsTotal,
        shortpaid: shortpaid,
        brokerClaim: totalBrokerClaim,
        clientCredit: totalClientCredit,
        otherFees: totalFees,
        chargebacks: totalChargebacks,
        directPayments: totalDirectPayments,
        nonFactoredPayments: totalNonFactoredPayments,
        additionalPayments: totalAdditionalPayments,
        dilution: dilution?.dilution || new Big(0),
        adjDilution: dilution?.adjDilution || new Big(0),
        writeOffs: totalWriteOffs,
        daysTurn: dilution?.daysToPay.round().toFixed() || '',
        nfe: totalsApproved?.netFundsEmployed || new Big(0),
        totalAR: totalsApproved?.totalAr || new Big(0),
        salesperson: config.salesRep?.user.getFullName() || 'N/A',
      };
      rows.push(row);
    }
    return rows;
  }

  private getMetadataRow(request: ClientSummaryRequest): string {
    const startDate = getFormattedDateInBusinessTimezone(request.startDate);
    const endDate = getFormattedDateInBusinessTimezone(request.endDate);
    const ranDate = getFormattedDateInBusinessTimezone(new Date());
    return (
      `Client Summary Report [${startDate} - ${endDate}]` +
      ` / Date ran: ${ranDate}`
    );
  }
}
