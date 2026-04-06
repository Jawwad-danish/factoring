import { environment } from '@core/environment';
import { UUID } from '@core/uuid';
import { Query } from '@mikro-orm/migrations';
import { MaintenanceEntity } from '@module-persistence';
import { BaseQueryGenerator } from './base-query-generator';

export type MaintenanceData = {
  isEnabled: boolean;
  message?: string;
};

export class MaintenanceQueryGenerator extends BaseQueryGenerator {
  addMaintenance(data: MaintenanceData): Query {
    const entity = this.buildMaintenanceEntity(data);
    return this.getQuery(
      this.driver.createQueryBuilder(MaintenanceEntity.name).insert(entity),
    );
  }

  private buildMaintenanceEntity(data: MaintenanceData): any {
    return {
      ...data,
      id: UUID.get(),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: environment.core.systemId(),
      updatedBy: environment.core.systemId(),
    };
  }
}
