import {
  ClientPaymentStatus,
  InvoiceEntity,
} from '@module-persistence/entities';
import { CompareStrategy, ComparisonResult } from '../components';
import { buildIncompleteEntity } from '../../v1-migrations/invoices/invoice-mapper';
import { Arrays } from '@core/util';

const createdAtAfter = '2025-12-15';

export class InvoicesBuyoutsStrategy extends CompareStrategy<InvoiceEntity> {
  private invoiceIds: string[] = [];
  private invoicesToBeChanged: InvoiceEntity[] = [];

  override async run(): Promise<Record<string, ComparisonResult>> {
    console.log(`[V1][${this.strategyName}] Fetching data...`);
    const v1Data = await this.getV1Data();
    console.log(`[V1][${this.strategyName}] - data count: ${v1Data.length}`);

    console.log(`[V2][${this.strategyName}] Fetching data...`);
    const v2Data = await this.getV2Data();
    console.log(`[V2][${this.strategyName}] - data count: ${v2Data.length}`);

    this.logSummary(v1Data, v2Data);
    return {
      [this.strategyName]: this.compareData(v1Data, v2Data),
    };
  }

  override async getV1Data(): Promise<InvoiceEntity[]> {
    const result = await this.v1Client.query(
      `select
            i.*,
            coalesce(json_agg(iu) filter (where iu.invoice_id is not null), '[]') as invoice_updates
          from
            invoices i
          left join invoice_updates iu on
            i.id = iu.invoice_id
          where
            i.is_buyout = true
            and i.created_at > '${createdAtAfter}'
          group by
            i.id
          `,
    );
    return result.rows.map((row) => {
      row.total_amount =
        Number(row.primary_rate) +
        Number(row.lumper) +
        Number(row.detention) -
        Number(row.advance);

      const invoiceEntity = buildIncompleteEntity(row);
      this.invoiceIds.push(row.id);
      return invoiceEntity;
    });
  }

  async getV2Data(): Promise<InvoiceEntity[]> {
    const qb = this.v2Repositories.invoice.queryBuilder();
    const invoices = await qb
      .select('*')
      .where({
        id: { $in: this.invoiceIds },
      })
      .getResultList();
    return invoices;
  }

  compareData(
    v1Data: InvoiceEntity[],
    v2Data: InvoiceEntity[],
  ): ComparisonResult {
    const result: ComparisonResult = {
      differences: [],
      missingInV2: [],
    };

    for (const v1Invoice of v1Data) {
      const foundV2Invoice = v2Data.find(
        (v2Invoice) => v2Invoice.id === v1Invoice.id,
      );
      if (!foundV2Invoice) {
        result.missingInV2.push(v1Invoice.id);
        continue;
      }
      if (foundV2Invoice.buyout !== null && v1Invoice['is_buyout'] === true) {
        continue;
      }

      if (
        v1Invoice['is_buyout'] === true &&
        (foundV2Invoice.clientPaymentStatus === ClientPaymentStatus.Completed ||
          foundV2Invoice.clientPaymentStatus === ClientPaymentStatus.Sent) &&
        (v1Invoice.clientPaymentStatus === ClientPaymentStatus.Completed ||
          v1Invoice.clientPaymentStatus === ClientPaymentStatus.Sent)
      ) {
        continue;
      }
      if (
        foundV2Invoice.clientPaymentStatus !== v1Invoice.clientPaymentStatus
      ) {
        this.invoicesToBeChanged.push(foundV2Invoice);
        result.differences.push({
          v1ObjectID: v1Invoice.id,
          v2ObjectID: foundV2Invoice.id,
          differences: [
            {
              key: 'clientPaymentStatus',
              v1Value: v1Invoice.clientPaymentStatus,
              v2Value: foundV2Invoice.clientPaymentStatus,
            },
          ],
        });
      }
    }

    const clientIdsToBeChanged = Arrays.uniqueNotNull(
      this.invoicesToBeChanged,
      (i) => i.clientId,
    );
    if (clientIdsToBeChanged.length === 0) {
      return result;
    }
    result.reimportClients = {
      reason: 'buyouts',
      count: clientIdsToBeChanged.length,
      ids: clientIdsToBeChanged,
    };
    return result;
  }
}
