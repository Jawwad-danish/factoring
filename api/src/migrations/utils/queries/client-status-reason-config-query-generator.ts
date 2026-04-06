import { QBFilterQuery } from '@mikro-orm/core';
import { ClientStatusReasonConfigEntity } from '@module-persistence/entities';
import { BaseQueryGenerator } from './base-query-generator';
import { environment } from '@core/environment';

export type ClientStatusReasonConfigData = {
  status: string;
  reason: string;
  notifyClient?: boolean;
  displayMessage?: boolean;
};

/**
 * Helper class used to manipulate client status reason configs in migrations.
 * This class only generates queries. These queries must
 * added to the migration for them to be executed
 */
export class ClientStatusReasonConfigQueryGenerator extends BaseQueryGenerator {
  insertMany(data: ClientStatusReasonConfigData[]) {
    const entities = this.buildClientStatusReasonConfigs(data);
    return this.getQuery(
      this.driver
        .createQueryBuilder(ClientStatusReasonConfigEntity.name)
        .insert(entities),
    );
  }

  removeByCondition(condition: QBFilterQuery<ClientStatusReasonConfigEntity>) {
    return this.getQuery(
      this.driver
        .createQueryBuilder(ClientStatusReasonConfigEntity)
        .delete(condition),
    );
  }

  updateReason(status: string, reason: string, updateData: any) {
    return this.getQuery(
      this.driver
        .createQueryBuilder(ClientStatusReasonConfigEntity.name)
        .update(updateData)
        .where({
          status: status,
          reason: reason,
        }),
    );
  }

  private buildClientStatusReasonConfigs(
    data: ClientStatusReasonConfigData[],
  ): any[] {
    return data.map((partial) => this.buildClientStatusReasonConfig(partial));
  }

  private buildClientStatusReasonConfig(
    data: ClientStatusReasonConfigData,
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
