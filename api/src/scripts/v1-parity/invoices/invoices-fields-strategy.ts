import { InvoiceEntity, RecordStatus } from '@module-persistence/entities';
import { FieldEqualityManager } from '../../util/parity';
import { buildIncompleteEntity } from '../../v1-migrations/invoices/invoice-mapper';
import { CompareStrategy, ComparisonResult } from '../components';
import { ParityChecker } from '../components/parity-checker';

const createdAtAfter = '2025-12-15';
export class InvoicesFieldsStrategy extends CompareStrategy<InvoiceEntity> {
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
        i.created_at > '${createdAtAfter}' and i.is_buyout = false
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
      return buildIncompleteEntity(row);
    });
  }

  async getV2Data(): Promise<InvoiceEntity[]> {
    const qb = this.v2Repositories.invoice.queryBuilder();
    const invoices = await qb
      .select('*')
      .where({
        recordStatus: RecordStatus.Active,
        buyout: null,
        createdAt: { $gte: createdAtAfter },
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
    const parityChecker = new ParityChecker<InvoiceEntity>([
      new FieldEqualityManager('status'),
      new FieldEqualityManager('lumper'),
      new FieldEqualityManager('deduction'),
      new FieldEqualityManager('advance'),
      new FieldEqualityManager('lineHaulRate'),
      new FieldEqualityManager('loadNumber'),
      new FieldEqualityManager('brokerPaymentStatus'),
      new FieldEqualityManager('clientPaymentStatus'),
      new FieldEqualityManager('verificationStatus'),
    ]);

    for (const v1Invoice of v1Data) {
      const foundV2Invoice = v2Data.find(
        (v2Invoice) => v2Invoice.id === v1Invoice.id,
      );
      if (!foundV2Invoice) {
        result.missingInV2.push(v1Invoice.id);
        continue;
      }
      const parityCheck = parityChecker.checkEquality(
        v1Invoice,
        foundV2Invoice,
      );
      if (parityCheck.areMatching()) {
        continue;
      }
      result.differences.push({
        v1ObjectID: v1Invoice.id,
        v2ObjectID: foundV2Invoice.id,
        differences: parityCheck.getDifferences(),
      });
    }
    return result;
  }
}
