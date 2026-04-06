import { raw } from '@mikro-orm/core';
import { RecordStatus } from '@module-persistence/entities';
import { FieldEqualityManager } from '../../util/parity';
import { CompareStrategy, ComparisonResult } from '../components';
import { ParityChecker } from '../components/parity-checker';

interface ClientData {
  clientId: string;
  total: number;
}

export class ClientReservesStrategy extends CompareStrategy<ClientData> {
  override async getV1Data(): Promise<ClientData[]> {
    const result = await this.v1Client.query(`
    SELECT DISTINCT ON (client_id)
        client_id as "clientId",
        total
    FROM balances
    ORDER BY client_id, created_at DESC`);
    return result.rows.map((row) => ({
      clientId: row.clientId,
      total: parseFloat(row.total),
    }));
  }

  override async getV2Data(): Promise<ClientData[]> {
    const queryBuilder = this.v2Repositories.reserve.queryBuilder();
    queryBuilder
      .select(['client_id', raw('SUM(amount) as total')])
      .where({ recordStatus: RecordStatus.Active })
      .groupBy('client_id')
      .orderBy({ [raw('total')]: 'DESC' });

    const result = await queryBuilder.execute('all', false);
    return result.map((row: any) => ({
      clientId: row.client_id,
      total: parseFloat(row.total || '0'),
    }));
  }

  override compareData(
    v1Data: ClientData[],
    v2Data: ClientData[],
  ): ComparisonResult {
    const result = this.buildEmptyDefaultResult();
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
