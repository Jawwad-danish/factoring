import { getDateInBusinessTimezone } from '@core/date-time';
import { raw } from '@mikro-orm/core';
import { S3ObjectLocator, S3Service } from '@module-aws';
import { ClientApi, LightweightClient } from '@module-clients';
import {
  ClientFactoringConfigsEntity,
  ClientFactoringStatus,
  InvoiceEntity,
  RecordStatus,
  ReportName,
} from '@module-persistence/entities';
import { Repositories } from '@module-persistence/repositories';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import Big from 'big.js';
import * as ExcelJS from 'exceljs';
import { Readable } from 'stream';
import { SalesforceReconciliationReportRequest } from '@fs-bobtail/factoring/data';
import { ReportError } from '../../../errors';
import { SalesforceReconciliationReportCommand } from '../../salesforce-reconciliation-report.command';
import { ReportHandler } from '../report-handler';

interface ReconciliationRecord {
  client: LightweightClient;
  salesforce: SalesforceEntry;
  stat?: ClientStatsEntry;
  config?: ClientFactoringConfigsEntity;
}

interface ClientStatsEntry {
  clientId: string;
  january: Big;
  february: Big;
  march: Big;
  april: Big;
  may: Big;
  june: Big;
  july: Big;
  august: Big;
  september: Big;
  octomber: Big;
  november: Big;
  december: Big;
  totalAR: Big;
  firstCreatedDate?: Date;
  lastCreatedDate?: Date;
  firstPurchasedDate?: Date;
}

interface SalesforceEntry {
  accountID: string;
  opportunityID: string;
  accountName: string;
  opportunityOwner: string;
  createdDate: Date;
  agreementSignedDate: Date;
  hoolSignStatus: string;
  stage: string;
  mc?: string;
  dot?: string;
  totalFactoredVolume?: Big;
  releaseDate?: Date;
  releaseReason?: string;
}

interface ReportRow {
  account18DigitID: string;
  opportunityID: string;
  accountName: string;
  opportunityOwner: string;
  createdDate: Date;
  agreementSignedDate: Date;
  helloSignStatus: string;
  stage: string;
  mc?: string;
  dot?: string;
  clientStatus?: string;
  dateOfRegistration?: Date;
  dateOfFirstInvoiceCreated?: Date;
  dateOfFirstInvoicePurchased?: Date;
  dateOfMostRecentInvoice?: Date;
  totalFactoredVolume?: Big;
  factoredVolumeJanuary?: Big;
  factoredVolumeFebruary?: Big;
  factoredVolumeMarch?: Big;
  factoredVolumeApril?: Big;
  factoredVolumeMay?: Big;
  factoredVolumeJune?: Big;
  factoredVolumeJuly?: Big;
  factoredVolumeAugust?: Big;
  factoredVolumeSeptember?: Big;
  factoredVolumeOctomber?: Big;
  factoredVolumeNovember?: Big;
  factoredVolumeDecember?: Big;
  releaseDate?: Date;
  releaseReason?: string;
}

@CommandHandler(SalesforceReconciliationReportCommand)
export class SalesforceReconciliationReportCommandHandler
  implements ICommandHandler<SalesforceReconciliationReportCommand, Readable>
{
  constructor(
    private readonly reportHandler: ReportHandler,
    private readonly s3Service: S3Service,
    private readonly clientApi: ClientApi,
    private readonly repositories: Repositories,
  ) {}

  async execute({
    request,
  }: SalesforceReconciliationReportCommand): Promise<Readable> {
    const salesforceEntries = await this.parseSalesfoceFile(request);
    const clientDetails = await this.getClients(salesforceEntries);
    const dataStream = await this.getReportDataStream(clientDetails);
    return this.reportHandler.processReport<ReportRow>(
      request.outputType,
      ReportName.PortfolioReserve,
      dataStream,
      {
        formatDefinition: {
          account18DigitID: { type: 'string', label: 'Account ID 18 Digit' },
          opportunityID: { type: 'string', label: 'Opportunity ID' },
          accountName: { type: 'string', label: 'Account Name' },
          opportunityOwner: { type: 'string', label: 'Opportunity Owner' },
          createdDate: { type: 'date-time', label: 'Created Date' },
          agreementSignedDate: {
            type: 'date-time',
            label: 'Agreement Signed Date',
          },
          helloSignStatus: { type: 'string', label: 'Hello Sign Status' },
          stage: { type: 'string', label: 'Stage' },
          mc: { type: 'string', label: 'MC #' },
          dot: { type: 'string', label: 'USDOT' },
          clientStatus: { type: 'string', label: 'Client Status' },
          dateOfRegistration: {
            type: 'date-time',
            label: 'Date of Registration',
          },
          dateOfFirstInvoiceCreated: {
            type: 'date-time',
            label: 'Date of First Invoice',
          },
          dateOfFirstInvoicePurchased: {
            type: 'date-time',
            label: 'Date of First Invoice Purchased',
          },
          dateOfMostRecentInvoice: {
            type: 'date-time',
            label: 'Date of Recent Invoice',
          },
          totalFactoredVolume: {
            type: 'currency',
            label: 'Total Factored Volume',
          },
          factoredVolumeJanuary: {
            type: 'currency',
            label: 'Factored Volume - January',
          },
          factoredVolumeFebruary: {
            type: 'currency',
            label: 'Factored Volume - February',
          },
          factoredVolumeMarch: {
            type: 'currency',
            label: 'Factored Volume - March',
          },
          factoredVolumeApril: {
            type: 'currency',
            label: 'Factored Volume - April',
          },
          factoredVolumeMay: {
            type: 'currency',
            label: 'Factored Volume - May',
          },
          factoredVolumeJune: {
            type: 'currency',
            label: 'Factored Volume - June',
          },
          factoredVolumeJuly: {
            type: 'currency',
            label: 'Factored Volume - July',
          },
          factoredVolumeAugust: {
            type: 'currency',
            label: 'Factored Volume - August',
          },
          factoredVolumeSeptember: {
            type: 'currency',
            label: 'Factored Volume - September',
          },
          factoredVolumeOctomber: {
            type: 'currency',
            label: 'Factored Volume - Octomber',
          },
          factoredVolumeNovember: {
            type: 'currency',
            label: 'Factored Volume - November',
          },
          factoredVolumeDecember: {
            type: 'currency',
            label: 'Factored Volume - December',
          },
          releaseDate: { type: 'date-time', label: 'Release Date' },
          releaseReason: { type: 'string', label: 'Release Reason' },
        },
      },
    );
  }

  private async parseSalesfoceFile({
    s3Bucket,
    s3Key,
  }: SalesforceReconciliationReportRequest): Promise<SalesforceEntry[]> {
    if (s3Bucket == null || s3Key == null) {
      throw ReportError.fromMessage(
        ReportName.SalesforceReconciliation,
        'Missing file input',
      );
    }
    const input = await this.s3Service.getObject(
      new S3ObjectLocator(s3Bucket, s3Key),
    );
    if (input.Body == null || !Readable.isReadable(input.Body as Readable)) {
      throw ReportError.fromMessage(
        ReportName.SalesforceReconciliation,
        'Could not read contents',
      );
    }
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.read(input.Body as Readable);
    const worksheet = workbook.getWorksheet('All opportunities signed - Mass');
    if (!worksheet) {
      throw ReportError.fromMessage(
        ReportName.SalesforceReconciliation,
        'Could not find worksheet',
      );
    }
    const rows: SalesforceEntry[] = (
      worksheet.getRows(13, worksheet.rowCount) ?? []
    )
      .filter((row) => row.hasValues)
      .map((row) => {
        return {
          accountID: String(row.values[3]),
          opportunityID: String(row.values[4]),
          accountName: row.values[5],
          opportunityOwner: row.values[6],
          createdDate: getDateInBusinessTimezone(row.values[7]).toDate(),
          agreementSignedDate: getDateInBusinessTimezone(
            row.values[8],
          ).toDate(),
          hoolSignStatus: row.values[9],
          stage: row.values[10],
          mc: String(row.values[11]),
          dot: String(row.values[12]),
          totalFactoredVolume: row.values[17]
            ? new Big(row.values[17])
            : undefined,
        };
      });
    return rows;
  }

  private async getClients(
    entries: SalesforceEntry[],
  ): Promise<ReconciliationRecord[]> {
    const clients = await this.clientApi.getAllClients();
    const records: Map<string, ReconciliationRecord> = new Map();
    for (const entry of entries) {
      const foundClient = clients.find(
        (client) =>
          client.mc === entry.mc ||
          client.dot === entry.dot ||
          client.name === entry.accountName,
      );
      if (!foundClient) {
        continue;
      }
      records.set(foundClient.id, {
        client: foundClient,
        salesforce: entry,
      });
    }
    await this.assignStats(records);
    await this.assignConfigs(records);
    return Array.from(records.values());
  }

  private async assignStats(
    records: Map<string, ReconciliationRecord>,
  ): Promise<void> {
    const purchasedInvoicesStats = await this.repositories
      .getEntityManager()
      .createQueryBuilder(InvoiceEntity)
      .select(
        raw(`client_id,
        SUM(case when extract(month from purchased_date) = 1 then accounts_receivable_value else 0 end) as january,
        SUM(case when extract(month from purchased_date) = 2 then accounts_receivable_value else 0 end) as february,
        SUM(case when extract(month from purchased_date) = 3 then accounts_receivable_value else 0 end) as march,
        SUM(case when extract(month from purchased_date) = 4 then accounts_receivable_value else 0 end) as april,
        SUM(case when extract(month from purchased_date) = 5 then accounts_receivable_value else 0 end) as may,
        SUM(case when extract(month from purchased_date) = 6 then accounts_receivable_value else 0 end) as june,
        SUM(case when extract(month from purchased_date) = 7 then accounts_receivable_value else 0 end) as july,
        SUM(case when extract(month from purchased_date) = 8 then accounts_receivable_value else 0 end) as august,
        SUM(case when extract(month from purchased_date) = 9 then accounts_receivable_value else 0 end) as september,
        SUM(case when extract(month from purchased_date) = 10 then accounts_receivable_value else 0 end) as octomber,
        SUM(case when extract(month from purchased_date) = 11 then accounts_receivable_value else 0 end) as november,
        SUM(case when extract(month from purchased_date) = 12 then accounts_receivable_value else 0 end) as december,
        SUM(accounts_receivable_value) as total_ar,
        MIN(created_at) as first_created_date,
        MAX(created_at) as last_created_date,
        MIN(purchased_date) as first_purchased_date`),
      )
      .where({
        clientId: Array.from(records.keys()),
        recordStatus: RecordStatus.Active,
      })
      .groupBy('clientId')
      .execute('all', false);
    for (const row of purchasedInvoicesStats) {
      const clientId = row['client_id'];
      const clientDetails = records.get(clientId);
      if (!clientDetails) {
        continue;
      }
      clientDetails.stat = {
        clientId,
        january: new Big(row['january']),
        february: new Big(row['february']),
        march: new Big(row['march']),
        april: new Big(row['april']),
        may: new Big(row['may']),
        june: new Big(row['june']),
        july: new Big(row['july']),
        august: new Big(row['august']),
        september: new Big(row['september']),
        octomber: new Big(row['octomber']),
        november: new Big(row['november']),
        december: new Big(row['december']),
        totalAR: new Big(row['total_ar']),
        firstCreatedDate: row['first_created_date']
          ? getDateInBusinessTimezone(row['first_created_date']).toDate()
          : undefined,
        lastCreatedDate: row['last_created_date']
          ? getDateInBusinessTimezone(row['last_created_date']).toDate()
          : undefined,
        firstPurchasedDate: row['first_purchased_date']
          ? getDateInBusinessTimezone(row['first_purchased_date']).toDate()
          : undefined,
      };
    }
  }

  private async assignConfigs(records: Map<string, ReconciliationRecord>) {
    const configs = await this.repositories
      .getEntityManager()
      .findAll(ClientFactoringConfigsEntity, {
        where: {
          clientId: Array.from(records.keys()),
          recordStatus: RecordStatus.Active,
        },
        populate: ['statusHistory'],
      });
    for (const config of configs) {
      const clientDetails = records.get(config.clientId);
      if (!clientDetails) {
        continue;
      }
      clientDetails.config = config;
    }
  }

  async getReportDataStream(
    records: ReconciliationRecord[],
  ): Promise<Readable> {
    const rows = this.toReportRows(records);
    return Readable.from(rows, {
      objectMode: true,
    });
  }

  private toReportRows(records: ReconciliationRecord[]): ReportRow[] {
    return records.map((record) => {
      let releaseReason: string | undefined;
      let releaseDate: Date | undefined;
      if (record.config?.status === ClientFactoringStatus.Released) {
        const history = record.config.statusHistory.find(
          (item) =>
            item.clientStatusReasonConfig.status ===
            ClientFactoringStatus.Released,
        );
        if (history) {
          releaseReason = history.clientStatusReasonConfig.reason;
          releaseDate = history.createdAt;
        }
      }
      return {
        account18DigitID: record.salesforce.accountID,
        opportunityID: record.salesforce.opportunityID,
        accountName: record.salesforce.accountName,
        opportunityOwner: record.salesforce.opportunityOwner,
        createdDate: record.salesforce.createdDate,
        agreementSignedDate: record.salesforce.agreementSignedDate,
        helloSignStatus: record.salesforce.hoolSignStatus,
        stage: record.salesforce.stage,
        mc: record.salesforce.mc,
        dot: record.salesforce.dot,
        clientStatus: record.config?.status,
        dateOfRegistration: record.config?.createdAt,
        dateOfFirstInvoiceCreated: record.stat?.firstCreatedDate,
        dateOfFirstInvoicePurchased: record.stat?.firstPurchasedDate,
        dateOfMostRecentInvoice: record.stat?.lastCreatedDate,
        totalFactoredVolume: record.stat?.totalAR,
        factoredVolumeJanuary: record.stat?.january,
        factoredVolumeFebruary: record.stat?.february,
        factoredVolumeMarch: record.stat?.march,
        factoredVolumeApril: record.stat?.april,
        factoredVolumeMay: record.stat?.may,
        factoredVolumeJune: record.stat?.june,
        factoredVolumeJuly: record.stat?.july,
        factoredVolumeAugust: record.stat?.august,
        factoredVolumeSeptember: record.stat?.september,
        factoredVolumeOctomber: record.stat?.octomber,
        factoredVolumeNovember: record.stat?.november,
        factoredVolumeDecember: record.stat?.december,
        releaseReason: releaseReason,
        releaseDate: releaseDate,
      };
    });
  }
}
