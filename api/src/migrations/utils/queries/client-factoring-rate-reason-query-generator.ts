import { environment } from '@core/environment';
import { QBFilterQuery } from '@mikro-orm/core';
import { BaseQueryGenerator } from './base-query-generator';
import { ClientFactoringRateReasonEntity } from '@module-persistence';

export type ClientFactorRateReasonData = {
  reason: string;
};

/**
 * Helper class used to manipulate client factor rate reasons in migrations.
 * This class only generates queries. These queries must
 * added to the migration for them to be executed
 */
export class ClientFactorRateReasonQueryGenerator extends BaseQueryGenerator {
  insertMany(data: ClientFactorRateReasonData[]) {
    const entities = this.buildClientStatusReasonConfigs(data);
    return this.getQuery(
      this.driver
        .createQueryBuilder(ClientFactoringRateReasonEntity.name)
        .insert(entities),
    );
  }

  removeByCondition(condition: QBFilterQuery<ClientFactoringRateReasonEntity>) {
    return this.getQuery(
      this.driver
        .createQueryBuilder(ClientFactoringRateReasonEntity)
        .delete(condition),
    );
  }

  private buildClientStatusReasonConfigs(
    data: ClientFactorRateReasonData[],
  ): any[] {
    return data.map((partial) => this.buildClientStatusReasonConfig(partial));
  }

  private buildClientStatusReasonConfig(data: ClientFactorRateReasonData): any {
    return {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: environment.core.systemId(),
      updatedBy: environment.core.systemId(),
    };
  }
}
