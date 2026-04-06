import { raw } from '@mikro-orm/postgresql';
import { RecordStatus } from '@module-persistence/entities';
import { FieldEqualityManager } from '../../util/parity';
import { CompareStrategy, ComparisonResult } from '../components';
import { ParityChecker } from '../components/parity-checker';

interface ClientData {
  clientId: string;
  total: number;
}

export class ClientInvoicesCountStrategy extends CompareStrategy<ClientData> {
  override async getV1Data(): Promise<ClientData[]> {
    const result = await this.v1Client.query(`
    SELECT client_id, COUNT(*) as count
    FROM invoices
    GROUP BY client_id
    ORDER BY count DESC`);
    return result.rows.map((row) => {
      return {
        clientId: row.client_id,
        total: parseInt(row.count, 10),
      };
    });
  }

  async getV2Data(): Promise<ClientData[]> {
    const qb = this.v2Repositories.invoice.queryBuilder();
    qb.select(['client_id', raw('COUNT(*) as count')])
      .where({ recordStatus: RecordStatus.Active })
      .groupBy('client_id')
      .orderBy({ [raw('count')]: 'DESC' });

    const result = await qb.execute('all', false);
    return result.map((row: any) => {
      return {
        clientId: row.client_id,
        total: parseInt(row.count, 10),
      };
    });
  }

  compareData(v1Data: ClientData[], v2Data: ClientData[]): ComparisonResult {
    const result: ComparisonResult = {
      differences: [],
      missingInV2: [],
    };
    const parityChecker = new ParityChecker<ClientData>([
      new FieldEqualityManager('total'),
    ]);

    for (const v1Client of v1Data) {
      const v2Client = v2Data.find(
        (client) => client.clientId === v1Client.clientId,
      );
      if (!v2Client) {
        result.missingInV2.push(v1Client.clientId);
        continue;
      }
      const parityCheck = parityChecker.checkEquality(v1Client, v2Client);
      if (parityCheck.areMatching()) {
        continue;
      }
      result.differences.push({
        v1ObjectID: v1Client.clientId,
        v2ObjectID: v2Client.clientId,
        differences: parityCheck.getDifferences(),
      });
    }
    return result;
  }
}
