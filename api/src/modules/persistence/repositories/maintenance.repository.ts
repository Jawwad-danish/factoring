import { DatabaseService } from '@module-database';
import { Inject, Injectable } from '@nestjs/common';
import { MaintenanceEntity } from '../entities';
import { BasicRepository } from './basic-repository';

@Injectable()
export class MaintenanceRepository extends BasicRepository<MaintenanceEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, MaintenanceEntity);
  }

  async getMaintenance(): Promise<MaintenanceEntity> {
    const result = await this.repository.find({}, { limit: 1 });
    return result[0];
  }

  async updateMaintenance(
    isEnabled: boolean,
    message?: string,
  ): Promise<MaintenanceEntity> {
    const entity = await this.getMaintenance();
    entity.isEnabled = isEnabled;
    if (message) {
      entity.message = message;
    }
    this.persist(entity);
    return entity;
  }
}
