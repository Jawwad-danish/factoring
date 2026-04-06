import { ClientFactoringConfigsEntity } from '@module-persistence/entities';
import { FieldEqualityManager } from '../../util/parity';
import { buildClientFactoringConfig } from '../../v1-migrations/clients/client-factoring-config/client-factoring-config-mapper';
import { ParityChecker } from '../components';
import {
  CompareStrategy,
  ComparisonResult,
} from '../components/compare-strategy';

export class ClientFieldsStrategy extends CompareStrategy<ClientFactoringConfigsEntity> {
  override async getV1Data(): Promise<ClientFactoringConfigsEntity[]> {
    const result = await this.v1Client.query('select * from clients');
    return result.rows.map((row) => buildClientFactoringConfig(row));
  }

  override async getV2Data(): Promise<ClientFactoringConfigsEntity[]> {
    const configs = await this.v2Repositories.clientFactoringConfig.find({});
    return configs;
  }

  override compareData(
    v1Data: ClientFactoringConfigsEntity[],
    v2Data: ClientFactoringConfigsEntity[],
  ): ComparisonResult {
    const result = this.buildEmptyDefaultResult();
    const parityChecker = new ParityChecker<ClientFactoringConfigsEntity>([
      new FieldEqualityManager('factoringRatePercentage'),
      new FieldEqualityManager('verificationPercentage'),
      new FieldEqualityManager('vip'),
      new FieldEqualityManager('status'),
      new FieldEqualityManager('clientLimitAmount'),
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
