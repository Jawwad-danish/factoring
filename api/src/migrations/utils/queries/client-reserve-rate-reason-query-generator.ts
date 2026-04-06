import { environment } from '@core/environment';
import { QBFilterQuery } from '@mikro-orm/core';
import { BaseQueryGenerator } from './base-query-generator';
import { ClientReserveRateReasonEntity } from '@module-persistence/entities';

export type ClientReserveRateReasonData = {
  reason: string;
};

/**
 * Helper class used to manipulate client reserve rate reasons in migrations.
 * This class only generates queries. These queries must
 * added to the migration for them to be executed
 */
export class ClientReserveRateReasonQueryGenerator extends BaseQueryGenerator {
  insertMany(data: ClientReserveRateReasonData[]) {
    const entities = this.buildClientStatusReasonConfigs(data);
    return this.getQuery(
      this.driver
        .createQueryBuilder(ClientReserveRateReasonEntity.name)
        .insert(entities),
    );
  }

  removeByCondition(condition: QBFilterQuery<ClientReserveRateReasonEntity>) {
    return this.getQuery(
      this.driver
        .createQueryBuilder(ClientReserveRateReasonEntity)
        .delete(condition),
    );
  }

  private buildClientStatusReasonConfigs(
    data: ClientReserveRateReasonData[],
  ): any[] {
    return data.map((partial) => this.buildClientStatusReasonConfig(partial));
  }

  private buildClientStatusReasonConfig(
    data: ClientReserveRateReasonData,
  ): any {
    return {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      created_by_id: environment.core.systemId(),
      updated_by_id: environment.core.systemId(),
    };
  }
}
